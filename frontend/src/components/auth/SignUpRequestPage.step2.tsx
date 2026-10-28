import React from 'react'
import { CheckCircle2, Lock, ShieldCheck } from 'lucide-react'
import { Role } from '../../types'
import { roleTheme } from '../../theme'
import { AuthCard } from './AuthShell'
import {
  AuthAlert,
  FieldError,
  PasswordField,
  PasswordRequirements,
  SecondaryButton,
  SubmitButton,
} from './AuthFormControls'

export function SignUpRequestSubmitted({
  organization,
  email,
  role,
  onSubmitted,
}: {
  organization: string
  email: string
  role: Role
  onSubmitted: () => void
}) {
  return (
    <AuthCard className="text-center">
      <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans mb-2 tracking-tight">
        Access request submitted
      </h2>
      <p className="text-sm text-slate-500 font-normal mb-7 leading-relaxed">
        We&apos;ve sent your request to the administrators of{' '}
        <span className="text-slate-900 font-semibold">{organization}</span>. You&apos;ll receive an activation
        email at <span className="text-slate-900 font-semibold">{email}</span> once your{' '}
        {roleTheme[role].label} workspace is approved.
      </p>

      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left mb-7 space-y-2.5">
        <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-bold">What happens next</p>
        {[
          'An admin reviews your request and confirms your role',
          'RBAC permissions are applied to your account',
          'You receive an activation link to sign in',
        ].map((item, i) => (
          <div key={item} className="flex items-start gap-2.5">
            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[9px] font-mono font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span className="text-xs text-slate-600 font-medium">{item}</span>
          </div>
        ))}
      </div>

      <SubmitButton type="button" onClick={onSubmitted} withArrow={false}>
        Back to Sign In
      </SubmitButton>
    </AuthCard>
  )
}

export function SignUpRequestStep2({
  form,
  set,
  errors,
  submitting,
  onBackStep,
  onSubmit,
}: {
  form: { password: string; confirm: string; agree: boolean }
  set: <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => void
  errors: Record<string, string>
  submitting: boolean
  onBackStep: () => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <PasswordField
        label="Account Password (Optional)"
        icon={Lock}
        value={form.password}
        onChange={v => set('password', v)}
        placeholder="Create a password (optional)"
        autoComplete="new-password"
        error={errors.password}
        disabled={submitting}
      />

      <PasswordRequirements value={form.password} />

      <PasswordField
        label="Confirm Password"
        icon={ShieldCheck}
        value={form.confirm}
        onChange={v => set('confirm', v)}
        placeholder="Re-enter your password"
        autoComplete="new-password"
        error={errors.confirm}
        disabled={submitting}
      />

      <div className="pt-1">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.agree}
            onChange={e => set('agree', e.target.checked)}
            className="mt-0.5 rounded border-slate-300 accent-blue-600 w-4 h-4 cursor-pointer"
          />
          <span className="text-xs text-slate-600 font-normal leading-relaxed">
            I agree to the MetaForge Terms of Service and Privacy Policy, and consent to my access request being
            reviewed by my organization&apos;s administrators.
          </span>
        </label>
        <FieldError>{errors.agree}</FieldError>
      </div>

      {errors.general && <AuthAlert tone="error">{errors.general}</AuthAlert>}

      <div className="flex gap-3 pt-2">
        <SecondaryButton onClick={onBackStep}>← Back</SecondaryButton>
        <div className="flex-1">
          <SubmitButton loading={submitting} loadingLabel="Submitting request…" withArrow={false}>
            Submit Access Request
          </SubmitButton>
        </div>
      </div>
    </form>
  )
}
