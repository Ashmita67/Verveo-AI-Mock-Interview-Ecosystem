import PageHeader from "@/components/common/PageHeader";
import ResumeLibrary from "@/components/resume/ResumeLibrary";

function ResumeManagementPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Resumes"
        title="Manage role-specific resume assets"
        description="Browse uploads, review compact summaries, and open full details only when needed."
        badge="Resume workspace"
      />
      <ResumeLibrary />
    </div>
  );
}

export default ResumeManagementPage;
