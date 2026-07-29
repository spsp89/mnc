"use client";

import type { ReactNode } from "react";

import { useFormStatus } from "react-dom";

export function AdminSubmitButton({
  children,
  pendingLabel = "Saving...",
  className,
  disabled = false,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={pending || disabled}>
      {pending ? pendingLabel : children}
    </button>
  );
}

export function AdminDeleteButton({
  children = "Delete",
  pendingLabel = "Deleting...",
  confirmMessage,
  className,
  disabled = false,
  title,
}: {
  children?: ReactNode;
  pendingLabel?: string;
  confirmMessage: string;
  className: string;
  disabled?: boolean;
  title?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={className}
      disabled={pending || disabled}
      title={title}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
