import { Suspense } from "react";
import Questionnaire from "@/components/Questionnaire";

export default function QuestionnairePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading questionnaire...</div>
    </div>}>
      <Questionnaire />
    </Suspense>
  );
}