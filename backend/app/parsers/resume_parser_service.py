import re
from pathlib import Path

import fitz


class ResumeParserService:
    section_patterns = {
        "skills": r"(?im)^skills\s*$",
        "projects": r"(?im)^projects\s*$",
        "experience": r"(?im)^(experience|work experience)\s*$",
        "education": r"(?im)^education\s*$",
        "certifications": r"(?im)^certifications?\s*$",
    }

    def extract_text(self, file_path: str) -> str:
        doc = fitz.open(file_path)
        pages = [page.get_text("text") for page in doc]
        doc.close()
        return "\n".join(pages).strip()

    def extract_sections(self, raw_text: str) -> dict[str, str]:
        text = raw_text.replace("\r", "\n")
        sections: dict[str, str] = {name: "" for name in self.section_patterns}
        matches = []
        for name, pattern in self.section_patterns.items():
            for match in re.finditer(pattern, text):
                matches.append((match.start(), name))
        matches.sort()
        if not matches:
            return sections
        for index, (start, name) in enumerate(matches):
            end = matches[index + 1][0] if index + 1 < len(matches) else len(text)
            sections[name] = text[start:end].split("\n", 1)[-1].strip()
        return sections

    def parse(self, file_path: str) -> dict:
        raw_text = self.extract_text(file_path)
        sections = self.extract_sections(raw_text)
        return {"raw_text": raw_text, "sections": sections}
