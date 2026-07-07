from uuid import UUID

from app.core.exceptions import NotFoundException
from app.evaluation.report_generation_service import ReportGenerationService
from app.repositories.report_repository import ReportRepository


class ReportService:
    def __init__(self, report_repo: ReportRepository, report_generation_service: ReportGenerationService):
        self.report_repo = report_repo
        self.report_generation_service = report_generation_service

    def get_for_interview(self, user, interview_id: UUID):
        report = self.report_repo.get_by_interview_id(interview_id)
        if not report or report.user_id != user.id:
            raise NotFoundException("Report not found")
        return report

    def generate(self, user, interview_id: UUID):
        return self.report_generation_service.generate(user=user, interview_id=interview_id)
