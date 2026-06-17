"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  children,
  pendingText,
  className = "t-btn t-btn-primary",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingText ?? "Сақталуда…" : children}
    </button>
  );
}
