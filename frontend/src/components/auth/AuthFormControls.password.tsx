import React, { useId } from 'react'
import { Check, Eye, EyeOff, LucideIcon, X } from 'lucide-react'
import { PASSWORD_RULES, passwordStrength } from '../../data/authService'
import { INPUT_BASE, INPUT_ERR, INPUT_OK } from './AuthFormControls.styles'
import { FieldError, FieldLabel } from './AuthFormControls.fields'

interface PasswordFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  icon?: LucideIcon
  error?: string
  autoComplete?: string
  disabled?: boolean
  action?: React.ReactNode
}

export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  autoComplete,
  disabled,
  action,
}: PasswordFieldProps) {
  const id = useId()
  const [visible, setVisible] = React.useState(false)

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
          type={visible ? 'text' : 'password'}
          value={value}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={!!error}
          onChange={e => onChange(e.target.value)}
          className={`${INPUT_BASE} ${Icon ? 'pl-12' : 'pl-4'} pr-12 ${error ? INPUT_ERR : INPUT_OK} disabled:opacity-60 disabled:cursor-not-allowed`}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible(v => !v)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
        >
          {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      <FieldError>{error}</FieldError>
    </div>
  )
}

/** Live password policy checklist + strength meter. */
export function PasswordRequirements({ value }: { value: string }) {
  const strength = passwordStrength(value)

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-bold">
          Password Requirements
        </p>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: strength.color }}>
          {value ? strength.label : '—'}
        </span>
      </div>

      <div className="flex gap-1">
        {PASSWORD_RULES.map((rule, i) => (
          <span
            key={rule.id}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{ background: i < strength.score ? strength.color : '#E2E8F0' }}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
        {PASSWORD_RULES.map(rule => {
          const passed = rule.test(value)
          return (
            <div key={rule.id} className="flex items-center gap-2">
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                  passed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'
                }`}
              >
                {passed ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
              </span>
              <span className={`text-[11px] font-medium ${passed ? 'text-slate-700' : 'text-slate-400'}`}>
                {rule.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
