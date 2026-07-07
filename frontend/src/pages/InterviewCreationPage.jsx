import PageHeader from "@/components/common/PageHeader";
import InterviewForm from "@/components/interview/InterviewForm";

function InterviewCreationPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Interview Builder"
        title="Design a focused practice session"
        description="Create role-specific interview loops that target the skills and signals hiring teams care about."
        badge="AI-configurable"
      />
      <InterviewForm />
    </div>
  );
}

export default InterviewCreationPage;
