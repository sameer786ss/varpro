"use client";

import { Bot, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function TutorPanel({ courseId }: { courseId?: string }) {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState(
    "Ask a learning question and I will generate a contextual explanation.",
  );
  const [isPending, startTransition] = useTransition();

  const onAsk = () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      toast.error("Please enter a question first.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/tutor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: trimmed, courseId }),
        });

        const payload = (await response.json()) as { answer?: string; error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "AI request failed");
        }

        setAnswer(payload.answer ?? "No answer returned.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to get tutor response";
        toast.error(message);
      }
    });
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-52 w-52 rounded-full bg-[radial-gradient(circle,_rgba(230,179,30,0.22),_transparent_62%)]" />

      <div className="relative">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-[var(--accent)]" />
          Gemma 3 27B IT Tutor
        </CardTitle>
        <CardDescription className="mt-1">
          Context-aware AI support for explanations, quick revision guides, and concept checks.
        </CardDescription>

        <div className="mt-4 space-y-3">
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Example: Explain how normalization reduces redundancy in relational databases."
          />
          <div className="flex items-center justify-between gap-3">
            <Button onClick={onAsk} disabled={isPending} type="button">
              <Sparkles className="mr-2 h-4 w-4" />
              {isPending ? "Generating..." : "Ask Tutor"}
            </Button>
            <span className="text-xs text-[var(--text-muted)]">Server-side API key usage only</span>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
            {answer}
          </div>
        </div>
      </div>
    </Card>
  );
}
