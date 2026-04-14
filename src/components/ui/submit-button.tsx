"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button, type ButtonProps } from "@/components/ui/button";

type SubmitButtonProps = ButtonProps & {
  pendingText?: string;
};

export function SubmitButton({
  children,
  disabled,
  pendingText = "Please wait...",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button {...props} disabled={disabled || pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? pendingText : children}
    </Button>
  );
}
