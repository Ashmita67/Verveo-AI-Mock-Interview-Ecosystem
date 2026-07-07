from statistics import mean
from uuid import UUID

from app.repositories.interview_repository import InterviewRepository
from app.repositories.report_repository import ReportRepository
from app.repositories.response_repository import ResponseRepository


class AnalyticsService:
    def __init__(
        self,
        interview_repo: InterviewRepository,
        response_repo: ResponseRepository,
        report_repo: ReportRepository,
    ):
        self.interview_repo = interview_repo
        self.response_repo = response_repo
        self.report_repo = report_repo

    def overview(self, user):
        interviews = self.interview_repo.list_by_user(user.id)
        reports = [self.report_repo.get_by_interview_id(item.id) for item in interviews]
        scored_reports = [report for report in reports if report and report.technical_score is not None]
        average_score = mean([report.technical_score or 0 for report in scored_reports]) if scored_reports else 0.0
        best_score = max([(report.overall_score or 0) for report in scored_reports], default=0)
        score_progression = [
            {
                "interview_id": str(report.interview_id),
                "score": report.overall_score or report.technical_score or 0,
                "generated_at": report.generated_at,
            }
            for report in scored_reports
        ]
        strongest, weakest = self._skill_extremes(reports)
        strongest_domains, weakest_domains = self._domain_extremes(interviews, reports)
        return {
            "interview_history_count": len(interviews),
            "average_score": round(float(average_score), 2),
            "best_score": int(best_score),
            "strongest_skills": strongest,
            "weakest_skills": weakest,
            "strongest_domains": strongest_domains,
            "weakest_domains": weakest_domains,
            "recent_interview_history": [
                {
                    "id": item.id,
                    "title": item.title,
                    "domain": item.domain,
                    "difficulty": item.difficulty,
                    "type": item.type,
                    "status": item.status,
                    "overall_score": item.overall_score,
                    "created_at": item.created_at,
                }
                for item in interviews[:5]
            ],
            "score_progression": score_progression,
        }

    def interview_history(self, user):
        interviews = self.interview_repo.list_by_user(user.id)
        return {
            "interviews": [
                {
                    "id": item.id,
                    "title": item.title,
                    "domain": item.domain,
                    "difficulty": item.difficulty,
                    "type": item.type,
                    "status": item.status,
                    "overall_score": item.overall_score,
                    "created_at": item.created_at,
                }
                for item in interviews
            ]
        }

    def skills(self, user):
        interviews = self.interview_repo.list_by_user(user.id)
        reports = [self.report_repo.get_by_interview_id(item.id) for item in interviews if self.report_repo.get_by_interview_id(item.id)]
        strongest, weakest = self._skill_extremes(reports)
        return {"strongest_skills": strongest, "weakest_skills": weakest}

    def _skill_extremes(self, reports):
        skill_scores = {}
        for report in reports:
            if not report:
                continue
            for text in [report.strengths, report.weaknesses, report.recommendations]:
                if not text:
                    continue
                for chunk in text.replace("[", "").replace("]", "").replace('"', "").split(","):
                    key = chunk.strip()
                    if not key:
                        continue
                    skill_scores.setdefault(key, 0)
                    skill_scores[key] += report.technical_score or 0
        ordered = sorted(skill_scores.items(), key=lambda item: item[1], reverse=True)
        strongest = [item[0] for item in ordered[:5]]
        weakest = [item[0] for item in sorted(skill_scores.items(), key=lambda item: item[1])[:5]]
        return strongest, weakest

    def _domain_extremes(self, interviews, reports):
        domain_scores = {}
        for index, interview in enumerate(interviews):
            report = reports[index] if index < len(reports) else None
            if not report:
                continue
            domain_key = getattr(interview.domain, "value", interview.domain)
            domain_scores.setdefault(domain_key, [])
            domain_scores[domain_key].append(report.overall_score or report.technical_score or 0)

        if not domain_scores:
            return [], []

        ordered = sorted(((domain, mean(scores)) for domain, scores in domain_scores.items()), key=lambda item: item[1], reverse=True)
        strongest = [item[0] for item in ordered[:5]]
        weakest = [item[0] for item in sorted(ordered, key=lambda item: item[1])[:5]]
        return strongest, weakest
