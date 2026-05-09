from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO


@dataclass(frozen=True)
class _PdfPage:
    content: bytes


class SimplePdfDocument:
    """Very small PDF writer for text-based documents using built-in Helvetica."""

    def __init__(self, title: str = "Document") -> None:
        self.title = title
        self.pages: list[_PdfPage] = []

    def add_page(self, lines: list[tuple[int, int, str]], page_width: int = 595, page_height: int = 842) -> None:
        stream = BytesIO()
        stream.write(b"BT\n/F1 10 Tf\n")

        for x, y, text in lines:
            escaped = self._escape_text(text)
            stream.write(f"1 0 0 1 {x} {y} Tm ({escaped}) Tj\n".encode("latin-1", errors="replace"))

        stream.write(b"ET\n")
        self.pages.append(_PdfPage(content=stream.getvalue()))
        self.page_width = page_width
        self.page_height = page_height

    def render(self) -> bytes:
        objects: list[bytes] = []

        def add_object(data: bytes) -> int:
            objects.append(data)
            return len(objects)

        font_id = add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

        page_ids: list[int] = []
        content_ids: list[int] = []

        for page in self.pages:
            content_stream = (
                f"<< /Length {len(page.content)} >>\nstream\n".encode("latin-1")
                + page.content
                + b"endstream"
            )
            content_ids.append(add_object(content_stream))

        pages_id_placeholder = len(objects) + len(content_ids) + 1

        for content_id in content_ids:
            page_obj = (
                f"<< /Type /Page /Parent {pages_id_placeholder} 0 R /MediaBox [0 0 {self.page_width} {self.page_height}] "
                f"/Resources << /Font << /F1 {font_id} 0 R >> >> /Contents {content_id} 0 R >>"
            ).encode("latin-1")
            page_ids.append(add_object(page_obj))

        kids = " ".join(f"{page_id} 0 R" for page_id in page_ids)
        pages_id = add_object(f"<< /Type /Pages /Kids [{kids}] /Count {len(page_ids)} >>".encode("latin-1"))

        catalog_id = add_object(f"<< /Type /Catalog /Pages {pages_id} 0 R >>".encode("latin-1"))

        output = BytesIO()
        output.write(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")

        offsets = [0]
        for index, obj in enumerate(objects, start=1):
            offsets.append(output.tell())
            output.write(f"{index} 0 obj\n".encode("latin-1"))
            output.write(obj)
            output.write(b"\nendobj\n")

        xref_start = output.tell()
        output.write(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
        output.write(b"0000000000 65535 f \n")
        for offset in offsets[1:]:
            output.write(f"{offset:010d} 00000 n \n".encode("latin-1"))

        output.write(
            (
                f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\n"
                f"startxref\n{xref_start}\n%%EOF"
            ).encode("latin-1")
        )
        return output.getvalue()

    @staticmethod
    def _escape_text(value: str) -> str:
        normalized = (
            value.replace("\\", "\\\\")
            .replace("(", "\\(")
            .replace(")", "\\)")
            .replace("\n", " ")
        )
        return normalized.encode("latin-1", errors="replace").decode("latin-1")
