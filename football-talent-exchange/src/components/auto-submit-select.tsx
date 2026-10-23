"use client";
import type { SelectHTMLAttributes } from "react";

/** Liste déroulante qui envoie son formulaire dès qu'on change la valeur. */
export function AutoSubmitSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}
