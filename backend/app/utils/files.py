from pathlib import Path
from uuid import uuid4

RESUME_ALIAS_PREFIXES = [
    "Brisk",
    "Bright",
    "Clever",
    "Clear",
    "Sharp",
    "Swift",
    "Calm",
    "Bold",
]

RESUME_ALIAS_NOUNS = [
    "Atlas",
    "Falcon",
    "Pilot",
    "Summit",
    "Beacon",
    "Harbor",
    "Slate",
    "Signal",
]


def ensure_dir(path: str | Path) -> Path:
    directory = Path(path)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def build_upload_path(base_dir: str, filename: str) -> Path:
    safe_name = Path(filename).name
    unique_name = f"{uuid4().hex}-{safe_name}"
    return ensure_dir(base_dir) / unique_name


def generate_resume_alias() -> str:
    prefix = RESUME_ALIAS_PREFIXES[uuid4().int % len(RESUME_ALIAS_PREFIXES)]
    noun = RESUME_ALIAS_NOUNS[uuid4().int % len(RESUME_ALIAS_NOUNS)]
    suffix = uuid4().hex[:4].upper()
    return f"{prefix} {noun} {suffix}"


def is_pdf(filename: str, content_type: str | None = None) -> bool:
    return filename.lower().endswith(".pdf") and (content_type in {None, "", "application/pdf"})
