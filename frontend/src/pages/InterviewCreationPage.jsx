import InterviewForm from "@/components/interview/InterviewForm";

function InterviewCreationPage() {
  return (
    <div className="flex min-h-screen items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl items-center">
        <InterviewForm />
      </div>
    </div>
  );
}

export default InterviewCreationPage;
