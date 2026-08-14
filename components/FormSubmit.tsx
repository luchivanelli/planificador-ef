"use client";

import { useFormStatus } from "react-dom";

export default function FormSubmit({
  children,
  className,
  title,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={onClick}
      className={`${className ?? ""} disabled:cursor-not-allowed disabled:opacity-60`}
      title={title}
    >
      {pending ? "Procesando..." : children}
    </button>
  );
}
