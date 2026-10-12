#!/usr/bin/env python3
"""Check local href/src references in root-level static HTML pages.

Dependency-free by design. Remote URLs, mailto links, and in-page anchors are
not checked. GitHub Pages handles those in the deployed environment.
"""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
ATTRIBUTES = {
    "a": ("href",),
    "link": ("href",),
    "script": ("src",),
    "img": ("src",),
    "iframe": ("src",),
    "video": ("src", "poster"),
    "audio": ("src",),
    "source": ("src",),
}
SKIP_SCHEMES = {"http", "https", "mailto", "tel", "data", "javascript", "blob"}


class AssetScanner(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.references: list[tuple[int, str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for attr, value in attrs:
            if attr in ATTRIBUTES.get(tag, ()) and value:
                self.references.append((self.getpos()[0], tag, value))

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)


def locate(page: Path, value: str) -> Path | None:
    value = value.strip()
    if not value or value.startswith(("#", "//")) or "${" in value or "{{" in value:
        return None
    parsed = urlsplit(value)
    if parsed.scheme.lower() in SKIP_SCHEMES or parsed.netloc:
        return None
    if parsed.scheme:  # e.g. a custom browser protocol
        return None
    if not parsed.path:
        return None
    relative = unquote(parsed.path)
    target = (ROOT / relative.lstrip("/")) if relative.startswith("/") else (page.parent / relative)
    return target.resolve()


def main() -> int:
    pages = sorted(ROOT.glob("*.html"))
    if not pages:
        print("ERROR: No HTML pages found at repository root.")
        return 1

    errors: list[str] = []
    total = 0
    for page in pages:
        scanner = AssetScanner()
        scanner.feed(page.read_text(encoding="utf-8"))
        for line, tag, value in scanner.references:
            target = locate(page, value)
            if target is None:
                continue
            total += 1
            if not target.is_relative_to(ROOT.resolve()):
                errors.append(f"{page.name}:{line} {tag}: path goes outside repo: {value}")
            elif not target.is_file() and not (target.is_dir() and (target / "index.html").is_file()):
                errors.append(f"{page.name}:{line} {tag}: missing local resource: {value}")

    if errors:
        print("Local reference check failed:\n" + "\n".join(f"  - {e}" for e in errors))
        return 1
    print(f"OK: Scanned {len(pages)} HTML pages and checked {total} local references.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
