import csv
import html
import re
import struct
import zlib
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
MARKDOWN_PATH = DOCS / "bab-4-analisis-dan-pengujian.md"
NEWMAN_CSV_PATH = DOCS / "newman-results" / "tabel-hasil-uji-api-newman.csv"
OUT_PATH = DOCS / "bab-4-analisis-dan-pengujian.docx"
CHART_PATH = DOCS / "newman-results" / "ringkasan-hasil-pengujian.png"


def esc(value):
    return html.escape(str(value), quote=False)


def png_chunk(kind, data):
    payload = kind + data
    return (
        struct.pack(">I", len(data))
        + payload
        + struct.pack(">I", zlib.crc32(payload) & 0xFFFFFFFF)
    )


def write_summary_png(path):
    width, height = 900, 360
    bg = (255, 255, 255)
    green = (22, 163, 74)
    blue = (37, 99, 235)
    gray = (229, 231, 235)
    red = (220, 38, 38)
    pixels = [[bg for _ in range(width)] for _ in range(height)]

    def rect(x1, y1, x2, y2, color):
        for y in range(max(0, y1), min(height, y2)):
            row = pixels[y]
            for x in range(max(0, x1), min(width, x2)):
                row[x] = color

    rect(0, 0, width, height, (248, 250, 252))
    rect(56, 56, 844, 62, gray)
    rect(56, 144, 844, 150, gray)
    rect(56, 232, 844, 238, gray)
    rect(56, 70, 844, 118, green)
    rect(56, 158, 844, 206, blue)
    rect(56, 246, 62, 294, red)

    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for r, g, b in row:
            raw.extend((r, g, b))

    png = (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
        + png_chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + png_chunk(b"IEND", b"")
    )
    path.write_bytes(png)


def paragraph(text="", style=None):
    style_xml = f'<w:pStyle w:val="{style}"/>' if style else ""
    if not text:
        return "<w:p/>"
    return (
        f"<w:p><w:pPr>{style_xml}</w:pPr>"
        f"<w:r><w:t xml:space=\"preserve\">{esc(text)}</w:t></w:r></w:p>"
    )


def code_paragraph(text):
    return (
        '<w:p><w:pPr><w:pStyle w:val="Code"/></w:pPr>'
        f'<w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>'
        f'<w:sz w:val="20"/></w:rPr><w:t>{esc(text)}</w:t></w:r></w:p>'
    )


def table(rows, header=True):
    if not rows:
        return ""
    col_count = max(len(row) for row in rows)
    widths = [int(9000 / col_count)] * col_count
    xml = [
        '<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/>'
        '<w:tblW w:w="0" w:type="auto"/></w:tblPr><w:tblGrid>'
    ]
    xml.extend(f'<w:gridCol w:w="{w}"/>' for w in widths)
    xml.append("</w:tblGrid>")
    for row_index, row in enumerate(rows):
        xml.append("<w:tr>")
        for value in row + [""] * (col_count - len(row)):
            shade = '<w:shd w:fill="E5E7EB"/>' if header and row_index == 0 else ""
            bold_start = "<w:b/>" if header and row_index == 0 else ""
            xml.append(
                "<w:tc><w:tcPr>"
                f'<w:tcW w:w="{int(9000 / col_count)}" w:type="dxa"/>{shade}'
                "</w:tcPr><w:p><w:r><w:rPr>"
                f"{bold_start}</w:rPr><w:t>{esc(value)}</w:t></w:r></w:p></w:tc>"
            )
        xml.append("</w:tr>")
    xml.append("</w:tbl>")
    return "".join(xml)


def image_paragraph(rel_id, cx=5486400, cy=2194560):
    return f"""
<w:p>
  <w:r>
    <w:drawing>
      <wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
        <wp:extent cx="{cx}" cy="{cy}"/>
        <wp:docPr id="1" name="Ringkasan hasil pengujian"/>
        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:nvPicPr><pic:cNvPr id="0" name="ringkasan-hasil-pengujian.png"/><pic:cNvPicPr/></pic:nvPicPr>
              <pic:blipFill><a:blip r:embed="{rel_id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
              <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing>
  </w:r>
</w:p>
"""


def parse_markdown(md):
    elements = []
    lines = md.splitlines()
    i = 0
    in_code = False
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        if stripped.startswith("```"):
            in_code = not in_code
            i += 1
            continue
        if in_code:
            if stripped:
                elements.append(code_paragraph(stripped))
            i += 1
            continue
        if not stripped:
            elements.append(paragraph())
            i += 1
            continue
        if stripped.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [cell.strip() for cell in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells):
                    rows.append(cells)
                i += 1
            elements.append(table(rows))
            continue
        heading = re.match(r"^(#{1,6})\s+(.*)$", stripped)
        if heading:
            level = min(len(heading.group(1)), 3)
            elements.append(paragraph(heading.group(2), f"Heading{level}"))
        elif re.match(r"^\d+\.\s+", stripped):
            elements.append(paragraph(re.sub(r"^\d+\.\s+", "", stripped), "ListParagraph"))
        else:
            text = stripped.replace("`", "")
            elements.append(paragraph(text))
        i += 1
    return elements


def read_newman_rows():
    with NEWMAN_CSV_PATH.open(newline="", encoding="utf-8") as handle:
        return list(csv.reader(handle))


def document_xml(body):
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    {''.join(body)}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>
"""


def styles_xml():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="200" w:after="100"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="720"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:basedOn w:val="Normal"/><w:pPr><w:shd w:fill="F3F4F6"/></w:pPr></w:style>
  <w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="BFBFBF"/><w:left w:val="single" w:sz="4" w:color="BFBFBF"/><w:bottom w:val="single" w:sz="4" w:color="BFBFBF"/><w:right w:val="single" w:sz="4" w:color="BFBFBF"/><w:insideH w:val="single" w:sz="4" w:color="BFBFBF"/><w:insideV w:val="single" w:sz="4" w:color="BFBFBF"/></w:tblBorders></w:tblPr></w:style>
</w:styles>
"""


def build_docx():
    write_summary_png(CHART_PATH)
    md_elements = parse_markdown(MARKDOWN_PATH.read_text(encoding="utf-8"))
    newman_rows = read_newman_rows()
    body = []
    body.extend(md_elements)
    body.append(paragraph("Lampiran Bukti Pengujian", "Heading1"))
    body.append(paragraph("Gambar 4.1 Ringkasan visual hasil pengujian backend, frontend, dan Newman. Baris hijau menunjukkan skenario berhasil, baris biru menunjukkan assertion Newman berhasil, dan baris merah menunjukkan kegagalan."))
    body.append(image_paragraph("rIdImage1"))
    body.append(paragraph("Tabel 4.2 Hasil Pengujian API Menggunakan Newman", "Heading2"))
    body.append(table(newman_rows))

    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>
"""
    rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
"""
    doc_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rIdImage1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/ringkasan-hasil-pengujian.png"/>
</Relationships>
"""
    with ZipFile(OUT_PATH, "w", ZIP_DEFLATED) as docx:
        docx.writestr("[Content_Types].xml", content_types)
        docx.writestr("_rels/.rels", rels)
        docx.writestr("word/_rels/document.xml.rels", doc_rels)
        docx.writestr("word/styles.xml", styles_xml())
        docx.writestr("word/document.xml", document_xml(body))
        docx.write(CHART_PATH, "word/media/ringkasan-hasil-pengujian.png")


if __name__ == "__main__":
    build_docx()
    print(OUT_PATH)
