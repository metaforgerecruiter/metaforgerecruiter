import React, { useState } from 'react'
import { CheckCircle2, Lock, LockKeyhole, ShieldCheck } from 'lucide-react'
import { isStrongPassword, resetPassword } from '../../data/authService'
import { AuthCard, AuthIconTile, AuthShell } from './AuthShell'
import { AuthAlert, PasswordField, PasswordRequirements, SubmitButton } from './AuthFormControls'

interface ResetPasswordPageProps {
  email: string
  resetToken?: string
  onDone: () => void
  onBack?: () => void
}

export function ResetPasswordPage({ email, resetToken, onDone, onBack }: ResetPasswordPageProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; general?: string }>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const next: typeof errors = {}
    if (!password) next.password = 'New password is required'
    else if (!isStrongPassword(password)) next.password = 'Password does not meet all requirements'
    if (!confirm) next.confirm = 'Confirm your new password'
    else if (confirm !== password) next.confirm = 'Passwords do not match'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    void (async () => {
      try {
        if (resetToken) {
          await resetPassword(resetToken, password)
        }
        setDone(true)
      } catch (err) {
        setErrors({ general: err instanceof Error ? err.message : 'Unable to update password. Try again.' })
      } finally {
        setLoading(false)
      }
    })()
  }

  // Once the password is changed there is nothing to go back to.
  const backHandler = done ? undefined : onBack

  const shell = (children: React.ReactNode) => (
    <AuthShell
      backLabel={backHandler ? 'Back to verification' : undefined}
      onBack={backHandler}
      eyebrow="Credential Security"
      headline={
        <>
          Set a new password
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            and secure your workspace.
          </span>
        </>
      }
      description="Your new password takes effect immediately and signs out any other active sessions on your account."
      bullets={[
        'Passwords are hashed and never stored in plain text',
        'All other devices are signed out after the change',
        'The reset is recorded in your organization audit log',
      ]}
    >
      {children}
    </AuthShell>
  )

  if (done) {
    return shell(
      <AuthCard className="text-center">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans tracking-tight mb-2">
          Password updated
        </h2>
        <p className="text-sm text-slate-500 font-normal mb-7 leading-relaxed">
          The password for <span className="text-slate-900 font-semibold">{email}</span> has been changed. Sign in with
          your new credentials to return to your workspace.
        </p>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-7 flex items-start gap-2.5 text-left">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            For your security, every other active session on this account has been signed out.
          </p>
        </div>

        <SubmitButton type="button" onClick={onDone} withArrow={false}>
          Continue to Sign In
        </SubmitButton>
      </AuthCard>
    )
  }

  return shell(
    <AuthCard>
      <AuthIconTile icon={LockKeyhole} tone="indigo" />

      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans tracking-tight mb-2">
        Reset password
      </h2>
      <p className="text-sm text-slate-500 mb-8 font-normal leading-relaxed">
        Choose a new password for <span className="text-slate-900 font-semibold">{email}</span>. It must satisfy every
        requirement below.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <PasswordField
          label="New Password"
          icon={Lock}
          value={password}
          onChange={v => {
            setPassword(v)
            setErrors(prev => ({ ...prev, password: undefined, general: undefined }))
          }}
          placeholder="Create a strong password"
          autoComplete="new-password"
          error={errors.password}
          disabled={loading}
        />

        <PasswordRequirements value={password} />

        <PasswordField
          label="Confirm New Password"
          icon={ShieldCheck}
          value={confirm}
          onChange={v => {
            setConfirm(v)
            setErrors(prev => ({ ...prev, confirm: undefined, general: undefined }))
          }}
          placeholder="Re-enter your new password"
          autoComplete="new-password"
          error={errors.confirm}
          disabled={loading}
        />

        {errors.general && <AuthAlert tone="error">{errors.general}</AuthAlert>}

        <div className="pt-1">
          <SubmitButton loading={loading} loadingLabel="Updating password…" withArrow={false}>
            Update Password
          </SubmitButton>
        </div>
      </form>

      <p className="text-center text-xs sm:text-sm text-slate-500 font-normal mt-7 pt-6 border-t border-slate-200/80">
        <button type="button" onClick={onDone} className="text-blue-600 font-semibold hover:underline cursor-pointer">
          ← Return to Sign In
        </button>
      </p>
    </AuthCard>
  )
}
