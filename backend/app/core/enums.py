from enum import Enum


class ProviderEnum(str, Enum):
    LOCAL = "local"
    GOOGLE = "google"


class InterviewDomainEnum(str, Enum):
    SOFTWARE_DEVELOPMENT = "Software Development"
    MACHINE_LEARNING = "Machine Learning"
    DATA_SCIENCE = "Data Science"
    FULL_STACK_DEVELOPMENT = "Full Stack Development"


class InterviewDifficultyEnum(str, Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"


class InterviewTypeEnum(str, Enum):
    TECHNICAL = "Technical"
    HR = "HR"
    BEHAVIORAL = "Behavioral"
    MIXED = "Mixed"


class InterviewStatusEnum(str, Enum):
    CREATED = "Created"
    ACTIVE = "Active"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class InterviewSourceEnum(str, Enum):
    GENERIC = "generic"
    RESUME_BASED = "resume_based"


class QuestionGeneratedByEnum(str, Enum):
    AI = "AI"
    QUESTION_BANK = "QuestionBank"


class OtpPurposeEnum(str, Enum):
    REGISTER = "register"
    RESET_PASSWORD = "reset_password"


class TokenTypeEnum(str, Enum):
    ACCESS = "access"
    REFRESH = "refresh"
