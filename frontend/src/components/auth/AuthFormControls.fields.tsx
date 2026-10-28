import React, { useId } from 'react'
import { AlertCircle, LucideIcon } from 'lucide-react'
import { INPUT_BASE, INPUT_ERR, INPUT_OK } from './AuthFormControls.styles'

export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
      {children}
    </label>
  )
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null
  return (
    <p className="text-xs font-mono text-rose-500 mt-1.5 flex items-center gap-1.5" role="alert">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {children}
    </p>
  )
}

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  icon?: LucideIcon
  error?: string
  autoComplete?: string
  disabled?: boolean
  inputMode?: 'text' | 'email' | 'tel' | 'numeric'
  action?: React.ReactNode
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  icon: Icon,
  error,
  autoComplete,
  disabled,
  inputMode,
  action,
}: TextFieldProps) {
  const id = useId()
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {action}
      </div>
      <div className="relative">
        {Icon && (
          <Icon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        )}
        <input
          id={id}
          type={type}
          value={value}
          inputMode={inputMode}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={!!error}
          onChange={e => onChange(e.target.value)}
          className={`${INPUT_BASE} ${Icon ? 'pl-12' : 'pl-4'} pr-4 ${error ? INPUT_ERR : INPUT_OK} disabled:opacity-60 disabled:cursor-not-allowed`}
        />
      </div>
      <FieldError>{error}</FieldError>
    </div>
  )
}
