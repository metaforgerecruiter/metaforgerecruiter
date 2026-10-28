import React from 'react'
import { Building2, CheckCircle2, Mail, Phone, User } from 'lucide-react'
import { Role } from '../../types'
import { roleTheme } from '../../theme'
import {
  FieldLabel,
  SubmitButton,
  TextField,
} from './AuthFormControls'
import { QuickAccountChooser } from './QuickAccountChooser'

export function SignUpRequestStep1({
  form,
  set,
  errors,
  requestableRoles,
  onBack,
  onNext,
  onQuickLogin,
}: {
  form: {
    firstName: string
    lastName: string
    email: string
    phone: string
    organization: string
    role: Role
  }
  set: <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => void
  errors: Record<string, string>
  requestableRoles: Role[]
  onBack: () => void
  onNext: (e: React.FormEvent) => void
  onQuickLogin?: (role: Role) => void
}) {
  return (
    <>
      {onQuickLogin && (
        <QuickAccountChooser variant="banner" onSelectRole={onQuickLogin} />
      )}
      <form onSubmit={onNext} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          label="First Name"
          icon={User}
          value={form.firstName}
          onChange={v => set('firstName', v)}
          placeholder="Jane"
          autoComplete="given-name"
          error={errors.firstName}
        />
        <TextField
          label="Last Name"
          icon={User}
          value={form.lastName}
          onChange={v => set('lastName', v)}
          placeholder="Smith"
          autoComplete="family-name"
          error={errors.lastName}
        />
      </div>

      <TextField
        label="Work Email Address"
        type="email"
        icon={Mail}
        value={form.email}
        onChange={v => set('email', v)}
        placeholder="jane@company.com"
        autoComplete="email"
        error={errors.email}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          label="CONTACT NUMBER (Optional)"
          type="tel"
          inputMode="tel"
          icon={Phone}
          value={form.phone}
          onChange={v => set('phone', v)}
          placeholder="+1 555 0100 (Optional)"
          autoComplete="tel"
        />
        <TextField
          label="Organization"
          icon={Building2}
          value={form.organization}
          onChange={v => set('organization', v)}
          placeholder="Acme Staffing Inc."
          autoComplete="organization"
          error={errors.organization}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel>Requested Platform Role</FieldLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {requestableRoles.map(r => {
            const theme = roleTheme[r]
            const active = form.role === r
            return (
              <button
                key={r}
                type="button"
                onClick={() => set('role', r)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-600/10 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full mb-2"
                  style={{ background: theme.accent }}
                  aria-hidden
                />
                <p className={`text-sm font-bold font-sans ${active ? 'text-blue-700' : 'text-slate-900'}`}>
                  {theme.label}
                </p>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5 leading-snug">{theme.portalTitle}</p>
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-slate-400 font-medium pt-1">
          Super Admin and Dev Team accounts are provisioned internally and cannot be requested here.
        </p>
      </div>

      <SubmitButton>Continue to Security</SubmitButton>

      <p className="text-center text-xs sm:text-sm text-slate-500 font-normal pt-1">
        Already have an account?{' '}
        <button type="button" onClick={onBack} className="text-blue-600 font-semibold hover:underline cursor-pointer">
          Sign In →
        </button>
      </p>
    </form>
    </>
  )
}
