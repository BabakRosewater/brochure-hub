"""Simple PDF text extractor utility."""

from pathlib import Path
import argparse

try:
    from pypdf import PdfReader
except ImportError as exc:  # pragma: no cover
    raise SystemExit("Install dependencies first: pip install -r scripts/requirements.txt") from exc


def extract_text(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract raw text from a brochure PDF")
    parser.add_argument("pdf", type=Path, help="Path to input PDF file")
    parser.add_argument("output", type=Path, help="Path to output markdown file")
    args = parser.parse_args()

    text = extract_text(args.pdf)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(text, encoding="utf-8")


if __name__ == "__main__":
    main()
