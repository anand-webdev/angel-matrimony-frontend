import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

// ─── Shared styling helper ────────────────────────────────────────────────────

export const inputCls = (error?: string, touched?: boolean) =>
  `w-full px-3 py-2.5 rounded-lg border text-sm text-text bg-white outline-none transition-all ${
    touched && error
      ? 'border-red-400 focus:ring-2 focus:ring-red-200'
      : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/15'
  }`;

// ─── Field wrapper ────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  error?: string;
  touched?: boolean;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Field({ label, error, touched, hint, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-text">
        {label}
        {required && <span className="text-primary ml-0.5">*</span>}
      </label>
      {children}
      {touched && error ? (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

// ─── TextInput ────────────────────────────────────────────────────────────────

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  touched?: boolean;
}

export function TextInput({ error, touched, className = '', ...props }: TextInputProps) {
  return (
    <input
      {...props}
      className={`${inputCls(error, touched)} ${className}`}
    />
  );
}

// ─── SelectInput ──────────────────────────────────────────────────────────────

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  touched?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectInput({
  error,
  touched,
  options,
  placeholder,
  className = '',
  ...props
}: SelectInputProps) {
  return (
    <select
      {...props}
      className={`${inputCls(error, touched)} ${className}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ─── MultiSelectInput (checkbox-based multi-select) ──────────────────────────

interface MultiSelectInputProps {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  columns?: number;
}

export function MultiSelectInput({ options, value, onChange, columns = 2 }: MultiSelectInputProps) {
  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  return (
    <div className={`grid gap-2 ${columns === 3 ? 'grid-cols-3' : columns === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {options.map((o) => (
        <label key={o.value} className="flex items-center gap-2 text-sm text-text cursor-pointer">
          <input
            type="checkbox"
            checked={value.includes(o.value)}
            onChange={() => toggle(o.value)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  touched?: boolean;
}

export function Textarea({ error, touched, className = '', ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={`${inputCls(error, touched)} resize-none ${className}`}
    />
  );
}
