import React, { useState } from 'react'
import { Lock, Mail, ShieldCheck } from 'lucide-react'
import { Role } from '../../types'
import { authenticate } from '../../data/authService'
import { AuthCard, AuthShell } from './AuthShell'
import { AuthAlert, PasswordField, SubmitButton, TextField } from './AuthFormControls'
import { QuickAccountChooser } from './QuickAccountChooser'

interface SignInPageProps {
  /** Called with the authenticated role — wires into the existing App session flow. */
  onLogin: (role: Role) => void
  onForgot: (email?: string) => void
  onSignup: () => void
  /** Back to the landing page */
  onBack: () => void
}

export function SignInPage({ onLogin, onForgot, onSignup, onBack }: SignInPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})
  const [loading, setLoading] = useState(false)

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    const result = await authenticate(email, password)
    if (!result.ok) {
      setErrors({ [result.field]: result.message })
      setLoading(false)
      return
    }

    const role = result.account.role
    window.setTimeout(() => {
      onLogin(role)
    }, 600)
  }

  return (
    <AuthShell
      wide
      backLabel="Back to home"
      onBack={onBack}
      eyebrow="Secure Workspace Access"
      headline={
        <>
          Sign in to your
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            recruitment command centre.
          </span>
        </>
      }
      description="One sign-in for requirements, candidates, submissions, interviews and recruiter performance — scoped to your role the moment you land."
      bullets={[
        'Email and password sign-in — no OTP required',
        'Role-based access for Super Admin, Admin, Lead, Recruiter, and Dev Team',
        'Every action captured in the platform audit trail',
      ]}
    >
      <AuthCard>
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 text-[11px] font-bold font-mono tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5" />
            MRAP Console
          </div>
          <span className="text-[11px] font-mono text-slate-400">Password Auth</span>
        </div>

        <QuickAccountChooser
          variant="full"
          onSelectRole={onLogin}
          onFillCredentials={(fillEmail, fillPass) => {
            setEmail(fillEmail)
            setPassword(fillPass)
            setErrors({})
          }}
        />

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-slate-400 font-mono">
              Or sign in with custom credentials
            </span>
          </div>
        </div>

        <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1 font-sans">
          Sign In
        </h2>
        <p className="text-xs text-slate-500 mb-4 font-normal leading-relaxed">
          Enter your work email and password. Access is granted based on your assigned role.
        </p>

        <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate>
          <TextField
            label="Work Email Address"
            type="email"
            icon={Mail}
            value={email}
            onChange={v => {
              setEmail(v)
              setErrors(prev => ({ ...prev, email: undefined, general: undefined }))
            }}
            placeholder="you@company.com"
            autoComplete="username"
            error={errors.email}
            disabled={loading}
          />

          <PasswordField
            label="Account Password"
            icon={Lock}
            value={password}
            onChange={v => {
              setPassword(v)
              setErrors(prev => ({ ...prev, password: undefined, general: undefined }))
            }}
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password}
            disabled={loading}
            action={
              <button
                type="button"
                onClick={() => onForgot(email)}
                className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            }
          />

          {errors.general && <AuthAlert tone="error">{errors.general}</AuthAlert>}

          <SubmitButton loading={loading} loadingLabel="Authenticating & loading workspace…">
            Sign In
          </SubmitButton>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-200/80">
          <p className="text-center text-xs text-slate-500 font-normal">
            Don&apos;t have workspace access?{' '}
            <button type="button" onClick={onSignup} className="text-blue-600 font-semibold hover:underline cursor-pointer">
              Request an account →
            </button>
          </p>
        </div>
      </AuthCard>
    </AuthShell>
  )
}
