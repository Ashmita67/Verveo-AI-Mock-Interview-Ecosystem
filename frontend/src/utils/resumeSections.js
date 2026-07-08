const SECTION_HEADERS = {
  skills: ["skills", "technical skills", "core skills"],
  projects: ["projects", "selected projects"],
  experience: ["experience", "work experience", "professional experience"],
  education: ["education", "academic background"],
  certifications: ["certifications", "licenses", "credentials"],
  achievements: ["achievements", "awards", "accomplishments"],
};

export const RESUME_SECTION_KEYS = ["skills", "projects", "experience", "education", "certifications", "achievements"];

function normalizeLine(line) {
  return line.trim().replace(/^[-•*]\s*/, "");
}

function isSectionHeader(line) {
  const normalized = line.trim().toLowerCase().replace(/:$/, "");
  return Object.values(SECTION_HEADERS).some((headers) => headers.includes(normalized));
}

function getSectionKey(line) {
  const normalized = line.trim().toLowerCase().replace(/:$/, "");
  return Object.entries(SECTION_HEADERS).find(([, headers]) => headers.includes(normalized))?.[0] ?? null;
}

export function parseResumeSections(parsedText = "") {
  const sections = {
    skills: [],
    projects: [],
    experience: [],
    education: [],
    certifications: [],
    achievements: [],
  };

  const lines = String(parsedText)
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);

  let currentSection = null;

  for (const line of lines) {
    if (isSectionHeader(line)) {
      currentSection = getSectionKey(line);
      continue;
    }

    if (currentSection) {
      sections[currentSection].push(line);
    }
  }

  return sections;
}

export function sectionsToCards(parsedText = "") {
  const sections = parseResumeSections(parsedText);
  return Object.entries(sections).map(([key, items]) => ({
    key,
    title: key.charAt(0).toUpperCase() + key.slice(1),
    items,
  }));
}

export function buildResumeSummary(resume) {
  const sections = parseResumeSections(resume?.parsed_text || "");
  const fileName = resume?.file_path?.split("/").pop() || "Resume PDF";
  const displayName = resume?.alias || fileName;
  const processed = Boolean(resume?.parsed_text || resume?.ats_score != null);
  const uploadedAt = resume?.updated_at || resume?.created_at || null;

  return {
    ...resume,
    fileName,
    displayName,
    uploadedAt,
    status: processed ? "Processed" : "Uploaded",
    skillsCount: sections.skills.length,
    projectsCount: sections.projects.length,
    experienceCount: sections.experience.length,
    educationCount: sections.education.length,
    certificationCount: sections.certifications.length,
    achievementCount: sections.achievements.length,
    sections,
  };
}
