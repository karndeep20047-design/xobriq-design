"use client";

import { Eye, EyeOff, AtSign, Lock, User2, Building2 } from "lucide-react";
import { useState, type ChangeEvent, type ComponentType } from "react";
import type { LucideProps } from "lucide-react";

type IconName = "email" | "lock" | "user" | "company";

const iconMap: Record<IconName, ComponentType<LucideProps>> = {
  email: AtSign,
  lock: Lock,
  user: User2,
  company: Building2,
};

type Props = {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "tel";
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  icon?: IconName;
  rightSlot?: React.ReactNode;
  defaultValue?: string;
  // Controlled mode — pass both to keep the field's value across a failed
  // submission (React/the browser may reset uncontrolled fields once the
  // form action settles, wiping data the user already typed correctly).
  // Omit both to keep the field uncontrolled, as before.
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  hint?: string;
  error?: string;
};

export function EnterpriseField({
  name,
  label,
  type = "text",
  placeholder,
  required,
  autoComplete,
  icon,
  rightSlot,
  defaultValue,
  value,
  onChange,
  hint,
  error,
}: Props) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && show ? "text" : type;
  const Icon = icon ? iconMap[icon] : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <label htmlFor={name} className="label-caps text-fg-muted">
          {label}
        </label>
        {rightSlot}
      </div>

      <div className="input-inset flex items-center rounded-lg px-3.5 py-2.5">
        {Icon ? <Icon className="mr-3 h-4 w-4 text-enterprise-fg-subtle" /> : null}

        <input
          id={name}
          name={name}
          type={inputType}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          {...(value !== undefined ? { value, onChange } : { defaultValue })}
          maxLength={200}
          aria-invalid={!!error}
          className="w-full border-none bg-transparent text-sm text-enterprise-fg placeholder:text-enterprise-fg-subtle/60 focus:outline-none focus:ring-0"
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            className="ml-2 text-enterprise-fg-subtle transition hover:text-enterprise-fg"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </div>

      {hint && !error ? <p className="px-1 text-xs text-enterprise-fg-subtle">{hint}</p> : null}
      {error ? <p className="px-1 text-xs text-xred-500">{error}</p> : null}
    </div>
  );
}