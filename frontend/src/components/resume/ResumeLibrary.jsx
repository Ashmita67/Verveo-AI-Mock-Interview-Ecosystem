import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { FileText, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";
import EmptyState from "@/components/common/EmptyState";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loader from "@/components/common/Loader";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import { deleteResume, listResumes, uploadResume } from "@/services/resumeService";
import { buildResumeSummary } from "@/utils/resumeSections";

function ResumeLibrary() {
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);

  const loadResumes = async () => {
    try {
      setLoading(true);
      setError("");
      const items = await listResumes();
      const ordered = [...items].sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
      setResumes(ordered);
      setSelectedResume(ordered[0] ?? null);
    } catch (err) {
      setError(err?.response?.data?.detail || "We couldn't load your resumes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const selectedSummary = useMemo(
    () => (selectedResume ? buildResumeSummary(selectedResume) : null),
    [selectedResume],
  );

  const handleUpload = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF resume.");
      return;
    }

    try {
      setUploading(true);
      setProgress(0);
      const response = await uploadResume(file, (event) => {
        if (event.total) {
          setProgress(Math.round((event.loaded * 100) / event.total));
        }
      });
      toast.success(response.message || "Resume uploaded successfully.");
      const updatedList = await listResumes();
      const ordered = [...updatedList].sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
      setResumes(ordered);
      setSelectedResume(ordered[0] ?? null);
      setProgress(100);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Resume upload failed.");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    await handleUpload(file);
  };

  const handleDelete = async (resume) => {
    if (!resume) return;
    try {
      setDeletingId(resume.id);
      await deleteResume(resume.id);
      toast.success("Resume deleted successfully.");
      const updatedList = await listResumes();
      const ordered = [...updatedList].sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
      setResumes(ordered);
      setSelectedResume(ordered[0] ?? null);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Resume delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <Loader label="Loading resume library..." />;
  }

  if (error) {
    return <ErrorMessage title="Resume library unavailable" description={error} />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Upload Resume</CardTitle>
              <CardDescription>Drag and drop a PDF resume or browse from your device.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => event.key === "Enter" && inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(event) => event.preventDefault()}
              className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-border/60 bg-muted/40 p-6 text-center transition duration-200 hover:-translate-y-0.5 hover:bg-muted/60"
            >
              <UploadCloud className="h-10 w-10 text-primary" />
              <p className="mt-4 text-base font-semibold">Drag & Drop Resume Upload</p>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">PDF only. The backend will parse, score, and store it.</p>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(event) => handleUpload(event.target.files?.[0])}
              />
              <Button
                className="mt-5"
                type="button"
                isLoading={uploading}
                onClick={(event) => {
                  event.stopPropagation();
                  inputRef.current?.click();
                }}
              >
                Upload PDF
              </Button>
            </div>
            {uploading ? (
              <div className="space-y-2">
                <ProgressBar value={progress} />
                <p className="text-sm text-muted-foreground">Uploading... {progress}%</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Resume List</CardTitle>
              <CardDescription>Recent uploads with quick access to details and deletion.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {resumes.length ? (
              resumes.map((resume) => (
                <button
                  key={resume.id}
                  type="button"
                  onClick={() => setSelectedResume(resume)}
                  className="flex w-full items-center justify-between rounded-[20px] bg-muted/40 p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:bg-muted/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/70">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{resume.alias || resume.file_path?.split("/").pop() || "Resume PDF"}</p>
                      {resume.alias && resume.file_path?.split("/").pop() ? (
                        <p className="text-xs text-muted-foreground">{resume.file_path.split("/").pop()}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        Updated {format(new Date(resume.updated_at || resume.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">ATS {resume.ats_score ?? "—"}</Badge>
                </button>
              ))
            ) : (
              <EmptyState
                title="No resumes uploaded yet"
                description="Upload your first resume to unlock ATS scoring and a compact summary."
                actionLabel="Choose PDF"
                onAction={() => inputRef.current?.click()}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Resume Summary</CardTitle>
            <CardDescription>Compact metadata and extraction counts only.</CardDescription>
          </div>
          {selectedSummary ? <Badge variant="info">ATS {selectedSummary.ats_score ?? "—"}</Badge> : null}
        </CardHeader>
        <CardContent className="space-y-5">
          {selectedSummary ? (
            <>
              <div className="rounded-[20px] bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Resume File Name</p>
                <p className="mt-1 font-semibold">{selectedSummary.displayName}</p>
                {selectedSummary.alias ? <p className="mt-1 text-xs text-muted-foreground">{selectedSummary.fileName}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  Uploaded {selectedSummary.uploadedAt ? format(new Date(selectedSummary.uploadedAt), "PPP") : "recently"}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] bg-muted/50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Resume Status</p>
                  <p className="mt-2 text-lg font-semibold">{selectedSummary.status}</p>
                </div>
                <div className="rounded-[20px] bg-muted/50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">ATS Score</p>
                  <p className="mt-2 text-lg font-semibold">{selectedSummary.ats_score ?? "—"}</p>
                </div>
                <div className="rounded-[20px] bg-muted/50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Skills Extracted</p>
                  <p className="mt-2 text-lg font-semibold">{selectedSummary.skillsCount}</p>
                </div>
                <div className="rounded-[20px] bg-muted/50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Projects Extracted</p>
                  <p className="mt-2 text-lg font-semibold">{selectedSummary.projectsCount}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
                  Upload New Resume
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(`/resume/${selectedSummary.id}`)}>
                  View Resume
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  isLoading={deletingId === selectedSummary.id}
                  onClick={() => handleDelete(selectedSummary)}
                >
                  Delete Resume
                </Button>
              </div>
            </>
          ) : (
            <EmptyState
              title="No resume selected"
              description="Uploaded resumes will appear here as a compact summary."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ResumeLibrary;
