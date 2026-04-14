import { TutorPanel } from "@/components/ai/tutor-panel";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";

export default async function AssistantPage() {
  const { profile } = await requireSession();

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle className="font-display text-3xl">AI Learning Assistant</CardTitle>
        <CardDescription className="mt-2 max-w-3xl text-sm leading-7 sm:text-base">
          Ask conceptual questions, request revision guides, and get guided breakdowns tailored to your
          learning path. Responses are generated with Gemma 3 27B IT via Google GenAI.
        </CardDescription>
        <p className="mt-4 text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Active role: {profile.role}
        </p>
      </Card>

      <TutorPanel />
    </div>
  );
}
