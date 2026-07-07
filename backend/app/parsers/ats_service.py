import re


class ATSService:
    keyword_weights = {
        "python": 5,
        "java": 5,
        "javascript": 5,
        "typescript": 5,
        "react": 5,
        "fastapi": 5,
        "sql": 4,
        "postgresql": 4,
        "docker": 4,
        "kubernetes": 3,
        "system design": 6,
        "leadership": 4,
        "communication": 3,
    }

    def score(self, resume_text: str) -> int:
        text = resume_text.lower()
        score = 35
        for keyword, weight in self.keyword_weights.items():
            if keyword in text:
                score += weight
        score += min(20, len(re.findall(r"\n[-•*]", resume_text)) * 2)
        score += min(10, len(resume_text) // 1000)
        return max(0, min(100, score))
