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
from .models import Dossier


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

    def extract_document_metadata(self, uploaded_file, dossier=None, dossier_options=None):
        file_bytes = uploaded_file.read()
        if not file_bytes:
            raise GeminiDocumentExtractionError("Le fichier envoye est vide.")

        uploaded_file.seek(0)

        mime_type = uploaded_file.content_type or mimetypes.guess_type(uploaded_file.name)[0] or 'application/octet-stream'
        dossier_choices = self._build_dossier_choices(dossier, dossier_options)
        prompt = self._build_prompt(dossier, dossier_choices)

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
        normalized = self._normalize_result(parsed, dossier, dossier_choices)
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

    def _build_dossier_choices(self, selected_dossier=None, dossier_options=None):
        if selected_dossier is not None:
            dossiers = [selected_dossier]
        elif dossier_options:
            dossier_ids = []
            for item in dossier_options:
                dossier_id = item.get('idDossier') or item.get('id')
                if dossier_id is None:
                    continue
                dossier_ids.append(dossier_id)
            dossiers = list(
                Dossier.objects.select_related('calendrier')
                .filter(idDossier__in=dossier_ids, calendrier__isnull=False)
                .order_by('idDossier')
            )
        else:
            dossiers = list(
                Dossier.objects.select_related('calendrier').filter(calendrier__isnull=False).order_by('idDossier')
            )

        choices = []
        for dossier in dossiers:
            choices.append({
                "id": str(dossier.idDossier),
                "nomDos": dossier.nomDos or '',
                "calendriers": self._build_allowed_calendriers(dossier),
            })
        return choices

    def _build_prompt(self, selected_dossier, dossier_choices):
        dossier_lines = []
        for dossier_choice in dossier_choices:
            calendrier_lines = "\n".join(
                f'    - calendrier_id: {item["id"]} | code: {item["code"]} | title: {item["title"]} | parent: {item["parent"] or "null"}'
                for item in dossier_choice["calendriers"]
            ) or "    - none"
            dossier_lines.append(
                f'- dossier_id: {dossier_choice["id"]} | nom: {dossier_choice["nomDos"] or "Sans nom"}\n{calendrier_lines}'
            )

        dossier_choices_text = "\n".join(dossier_lines) or "- none"
        dossier_instruction = (
            f"Le dossier parent est deja choisi et doit rester dossier={selected_dossier.idDossier}.\n"
            "Tu ne dois pas changer le dossier.\n"
            if selected_dossier is not None
            else "Tu dois choisir un dossier uniquement parmi la liste autorisee ci-dessous et retourner son id exact.\n"
        )

        return (
            "Analyse ce fichier archive et retourne uniquement un JSON valide sans markdown.\n"
            "Remplis les champs document suivants a partir du contenu du fichier.\n"
            f"{dossier_instruction}"
            "La phase doit toujours etre fixee a 1.\n"
            "Tu dois choisir un calendrier uniquement parmi la liste autorisee pour le dossier retenu, sinon retourne null.\n"
            "Les valeurs autorisees pour niv_confidentialite sont: PUBLIC, INTERNE, CONFIDENTIEL, SECRET.\n"
            "Si tu es incertain, choisis la valeur la plus prudente parmi INTERNE, CONFIDENTIEL, SECRET.\n"
            "Si une date de creation du document est visible, retourne-la au format YYYY-MM-DD, sinon null.\n"
            "La description doit etre courte, utile et factuelle.\n"
            "Retourne ce schema JSON exact:\n"
            "{"
            "\"titre\": string | null, "
            "\"dossier\": string | {\"id\": string}, "
            "\"calendrier\": string | null, "
            "\"niv_confidentialite\": \"PUBLIC\" | \"INTERNE\" | \"CONFIDENTIEL\" | \"SECRET\", "
            "\"auteur\": string | null, "
            "\"date_creation\": string | null, "
            "\"description\": string | null, "
            "\"phase_archive\": 1, "
            "\"warnings\": string[]"
            "}\n"
            f"Liste des dossiers et calendriers autorises:\n{dossier_choices_text}"
        )

    def _normalize_result(self, parsed, selected_dossier, dossier_choices):
        dossier_map = {item["id"]: item for item in dossier_choices}

        raw_dossier = parsed.get("dossier")
        if isinstance(raw_dossier, dict):
            raw_dossier = raw_dossier.get("id") or raw_dossier.get("idDossier")

        if selected_dossier is not None:
            dossier_id = str(selected_dossier.idDossier)
        else:
            dossier_id = str(raw_dossier or "")
            if dossier_id not in dossier_map:
                raise GeminiDocumentExtractionError("Gemini n'a pas retourne de dossier valide.")

        dossier_choice = dossier_map.get(dossier_id)
        if dossier_choice is None:
            raise GeminiDocumentExtractionError("Le dossier choisi n'est pas autorise.")

        allowed_calendrier_ids = {item["id"] for item in dossier_choice["calendriers"]}
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

        author = parsed.get("auteur")
        if author is not None:
            author = str(author).strip() or None

        creation_date = parsed.get("date_creation")
        if creation_date is not None:
            creation_date = str(creation_date).strip() or None
            if creation_date and not self._is_iso_date(creation_date):
                warnings.append("La date extraite n'etait pas au format YYYY-MM-DD et a ete ignoree.")
                creation_date = None

        return {
            "titre": title,
            "dossier": dossier_id,
            "calendrier": calendrier_id,
            "niv_confidentialite": confidentiality,
            "auteur": author,
            "date_creation": creation_date,
            "description": description,
            "phase_archive": "1",
            "warnings": warnings,
        }

    def _is_iso_date(self, value):
        if len(value) != 10:
            return False
        year, month, day = value.split('-', 2) if value.count('-') == 2 else ('', '', '')
        return year.isdigit() and month.isdigit() and day.isdigit()

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
