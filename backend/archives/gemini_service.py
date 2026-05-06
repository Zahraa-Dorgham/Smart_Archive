import base64
import importlib
import json
import mimetypes
import os
from pathlib import Path
import urllib.error
import urllib.request

from django.conf import settings

from calendrier.models import Calendrier


class GeminiDocumentExtractionError(Exception):
    pass


class GeminiDocumentExtractionService:
    INLINE_SIZE_LIMIT = 20 * 1024 * 1024

    def __init__(self, api_key=None, model=None):
        self.api_key = api_key or self._resolve_setting('GEMINI_API_KEY')
        self.model = model or self._resolve_setting('GEMINI_MODEL', default='gemini-2.5-flash-lite')

        if not self.api_key:
            raise GeminiDocumentExtractionError(
                "La cle GEMINI_API_KEY n'est pas configuree sur le backend."
            )

    def _resolve_setting(self, name, default=''):
        value = getattr(settings, name, '')
        if value:
            return value

        env_value = os.environ.get(name, '')
        if env_value:
            return env_value

        try:
            local_settings = importlib.import_module('myapp.local_settings')
            imported_value = getattr(local_settings, name, '')
            if imported_value:
                return imported_value
        except Exception:
            pass

        fallback_file = Path(__file__).resolve().parents[1] / 'myapp' / 'local_settings.py'
        if fallback_file.exists():
            file_value = self._read_value_from_file(fallback_file, name)
            if file_value:
                return file_value

        return default

    def _read_value_from_file(self, file_path, variable_name):
        prefix = f'{variable_name} ='
        try:
            for line in file_path.read_text(encoding='utf-8').splitlines():
                stripped = line.strip()
                if not stripped.startswith(prefix):
                    continue
                raw_value = stripped.split('=', 1)[1].strip()
                if raw_value.startswith(("'", '"')) and raw_value.endswith(("'", '"')):
                    return raw_value[1:-1]
                return raw_value
        except Exception:
            return ''
        return ''

    def extract_document_metadata(self, uploaded_file, dossier):
        file_bytes = uploaded_file.read()
        if not file_bytes:
            raise GeminiDocumentExtractionError("Le fichier envoye est vide.")

        uploaded_file.seek(0)

        mime_type = uploaded_file.content_type or mimetypes.guess_type(uploaded_file.name)[0] or 'application/octet-stream'
        allowed_calendriers = self._build_allowed_calendriers(dossier)
        prompt = self._build_prompt(dossier, allowed_calendriers)

        contents = [
            {
                "role": "user",
                "parts": [
                    {"text": prompt},
                    self._build_file_part(uploaded_file.name, mime_type, file_bytes),
                ],
            }
        ]

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json",
            },
        }

        response_data = self._post_json(
            f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent",
            payload,
            extra_headers={"x-goog-api-key": self.api_key},
        )

        parsed = self._parse_model_response(response_data)
        normalized = self._normalize_result(parsed, dossier, allowed_calendriers)
        return normalized

    def _build_file_part(self, filename, mime_type, file_bytes):
        if len(file_bytes) <= self.INLINE_SIZE_LIMIT:
            return {
                "inline_data": {
                    "mime_type": mime_type,
                    "data": base64.b64encode(file_bytes).decode('ascii'),
                }
            }

        upload_info = self._upload_file(filename, mime_type, file_bytes)
        return {
            "file_data": {
                "mime_type": upload_info["mimeType"],
                "file_uri": upload_info["uri"],
            }
        }

    def _upload_file(self, filename, mime_type, file_bytes):
        metadata_payload = {
            "file": {
                "display_name": filename,
            }
        }
        request = urllib.request.Request(
            "https://generativelanguage.googleapis.com/upload/v1beta/files",
            data=json.dumps(metadata_payload).encode('utf-8'),
            headers={
                "x-goog-api-key": self.api_key,
                "Content-Type": "application/json",
                "X-Goog-Upload-Protocol": "resumable",
                "X-Goog-Upload-Command": "start",
                "X-Goog-Upload-Header-Content-Length": str(len(file_bytes)),
                "X-Goog-Upload-Header-Content-Type": mime_type,
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                upload_url = response.headers.get("X-Goog-Upload-URL")
        except urllib.error.HTTPError as exc:
            raise GeminiDocumentExtractionError(self._read_http_error(exc)) from exc
        except urllib.error.URLError as exc:
            raise GeminiDocumentExtractionError(f"Erreur reseau Gemini: {exc.reason}") from exc

        if not upload_url:
            raise GeminiDocumentExtractionError("Gemini n'a pas retourne d'URL d'upload.")

        upload_request = urllib.request.Request(
            upload_url,
            data=file_bytes,
            headers={
                "Content-Length": str(len(file_bytes)),
                "X-Goog-Upload-Offset": "0",
                "X-Goog-Upload-Command": "upload, finalize",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(upload_request, timeout=120) as response:
                body = response.read().decode('utf-8')
        except urllib.error.HTTPError as exc:
            raise GeminiDocumentExtractionError(self._read_http_error(exc)) from exc
        except urllib.error.URLError as exc:
            raise GeminiDocumentExtractionError(f"Erreur reseau Gemini: {exc.reason}") from exc

        payload = json.loads(body)
        file_info = payload.get("file") or {}
        if not file_info.get("uri"):
            raise GeminiDocumentExtractionError("Gemini n'a pas retourne d'URI de fichier.")
        return file_info

    def _build_allowed_calendriers(self, dossier):
        if not dossier.calendrier_id:
            return []

        allowed_ids = {str(dossier.calendrier_id)}
        pending_ids = [dossier.calendrier_id]

        while pending_ids:
            child_ids = list(
                Calendrier.objects.filter(parent_id__in=pending_ids).values_list('id', flat=True)
            )
            new_ids = [child_id for child_id in child_ids if str(child_id) not in allowed_ids]
            if not new_ids:
                break
            allowed_ids.update(str(child_id) for child_id in new_ids)
            pending_ids = new_ids

        calendriers = Calendrier.objects.filter(id__in=allowed_ids).order_by('code', 'title')
        return [
            {
                "id": str(calendrier.id),
                "code": calendrier.code,
                "title": calendrier.title,
                "parent": str(calendrier.parent_id) if calendrier.parent_id else None,
            }
            for calendrier in calendriers
        ]

    def _build_prompt(self, dossier, allowed_calendriers):
        calendrier_choices = "\n".join(
            f'- id: {item["id"]} | code: {item["code"]} | title: {item["title"]} | parent: {item["parent"] or "null"}'
            for item in allowed_calendriers
        ) or "- none"

        return (
            "Analyse ce fichier archive et retourne uniquement un JSON valide sans markdown.\n"
            "Remplis les champs document suivants a partir du contenu du fichier.\n"
            f"Le dossier parent est deja choisi et doit rester dossier={dossier.idDossier}.\n"
            "Tu ne dois pas changer le dossier.\n"
            "La phase doit toujours etre fixee a 1.\n"
            "Tu dois choisir un calendrier uniquement parmi la liste autorisee ci-dessous, sinon retourne null.\n"
            "Les valeurs autorisees pour niv_confidentialite sont: PUBLIC, INTERNE, CONFIDENTIEL, SECRET.\n"
            "Si tu es incertain, choisis la valeur la plus prudente parmi INTERNE, CONFIDENTIEL, SECRET.\n"
            "La description doit etre courte, utile et factuelle.\n"
            "Retourne ce schema JSON exact:\n"
            "{"
            "\"titre\": string | null, "
            "\"calendrier\": string | null, "
            "\"niv_confidentialite\": \"PUBLIC\" | \"INTERNE\" | \"CONFIDENTIEL\" | \"SECRET\", "
            "\"description\": string | null, "
            "\"phase_archive\": 1, "
            "\"warnings\": string[]"
            "}\n"
            f"Liste des calendriers autorises pour le dossier {dossier.idDossier}:\n{calendrier_choices}"
        )

    def _normalize_result(self, parsed, dossier, allowed_calendriers):
        allowed_calendrier_ids = {item["id"] for item in allowed_calendriers}
        calendrier_id = parsed.get("calendrier")
        if calendrier_id is not None:
            calendrier_id = str(calendrier_id)
            if calendrier_id not in allowed_calendrier_ids:
                calendrier_id = None

        confidentiality = str(parsed.get("niv_confidentialite") or "INTERNE").upper()
        if confidentiality not in {"PUBLIC", "INTERNE", "CONFIDENTIEL", "SECRET"}:
            confidentiality = "INTERNE"

        warnings = parsed.get("warnings")
        if not isinstance(warnings, list):
            warnings = []

        title = parsed.get("titre")
        if title is not None:
            title = str(title).strip() or None

        description = parsed.get("description")
        if description is not None:
            description = str(description).strip() or None

        return {
            "titre": title,
            "dossier": str(dossier.idDossier),
            "calendrier": calendrier_id,
            "niv_confidentialite": confidentiality,
            "description": description,
            "phase_archive": "1",
            "warnings": warnings,
        }

    def _parse_model_response(self, response_data):
        candidates = response_data.get("candidates") or []
        for candidate in candidates:
            content = candidate.get("content") or {}
            for part in content.get("parts") or []:
                text = part.get("text")
                if not text:
                    continue
                try:
                    return json.loads(text)
                except json.JSONDecodeError:
                    cleaned = text.strip()
                    if cleaned.startswith("```"):
                        cleaned = cleaned.strip("`")
                        cleaned = cleaned.replace("json", "", 1).strip()
                    try:
                        return json.loads(cleaned)
                    except json.JSONDecodeError:
                        continue
        raise GeminiDocumentExtractionError("Gemini n'a pas retourne un JSON exploitable.")

    def _post_json(self, url, payload, extra_headers=None):
        headers = {
            "Content-Type": "application/json",
        }
        if extra_headers:
            headers.update(extra_headers)

        request = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers=headers,
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                return json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as exc:
            raise GeminiDocumentExtractionError(self._read_http_error(exc)) from exc
        except urllib.error.URLError as exc:
            raise GeminiDocumentExtractionError(f"Erreur reseau Gemini: {exc.reason}") from exc

    def _read_http_error(self, exc):
        try:
            body = exc.read().decode('utf-8')
        except Exception:
            body = ''

        if body:
            try:
                payload = json.loads(body)
                message = payload.get("error", {}).get("message")
                if message:
                    return f"Erreur Gemini: {message}"
            except json.JSONDecodeError:
                return f"Erreur Gemini: {body}"

        return f"Erreur Gemini HTTP {exc.code}"
