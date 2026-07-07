import api from "@/services/api";

export async function uploadResume(file, onUploadProgress) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/resumes/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return data;
}

export async function listResumes() {
  const { data } = await api.get("/resumes");
  return data.items ?? [];
}

export async function getResume(resumeId) {
  const { data } = await api.get(`/resumes/${resumeId}`);
  return data;
}

export async function deleteResume(resumeId) {
  const { data } = await api.delete(`/resumes/${resumeId}`);
  return data;
}
