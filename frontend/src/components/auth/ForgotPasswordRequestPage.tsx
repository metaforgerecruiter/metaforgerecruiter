import React, { useState } from 'react'
import { KeyRound, Mail } from 'lucide-react'
import { isValidEmail } from '../../data/authService'
import { AuthCard, AuthIconTile, AuthShell } from './AuthShell'
import { AuthAlert, SubmitButton, TextField } from './AuthFormControls'

interface ForgotPasswordRequestPageProps {
  initialEmail?: string
  /** Fired with the verified work email once a reset code has been issued */
  onCodeSent: (email: string) => void | Promise<void>
  /** Return to sign in */
  onBack: () => void
}

export function ForgotPasswordRequestPage({ initialEmail = '', onCodeSent, onBack }: ForgotPasswordRequestPageProps) {
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setNotice('')

    const trimmed = email.trim()
    if (!trimmed) {
      setError('Work email address is required')
      return
    }
    if (!isValidEmail(trimmed)) {
      setError('Enter a valid work email address')
      return
    }

    setError('')
    setLoading(true)

    void Promise.resolve(onCodeSent(trimmed)).finally(() => {
      setLoading(false)
    })
  }

  return (
    <AuthShell
      backLabel="Back to sign in"
      onBack={onBack}
      eyebrow="Account Recovery"
      headline={
        <>
          Locked out?
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Let&apos;s get you back in.
          </span>
        </>
      }
      description="We'll email a single-use verification code to your registered work address so you can set a new password securely."
      bullets={[
        'Codes expire after 10 minutes and can only be used once',
        'Recovery attempts are written to the platform audit log',
        'Your existing session and role permissions stay untouched',
      ]}
    >
      <AuthCard>
        <AuthIconTile icon={KeyRound} tone="amber" />

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans tracking-tight mb-2">
          Forgot password
        </h2>
        <p className="text-sm text-slate-500 mb-8 font-normal leading-relaxed">
          Enter the work email registered with your MRAP account and we&apos;ll send a verification code to reset your
          password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <TextField
            label="Work Email Address"
            type="email"
            icon={Mail}
            value={email}
            onChange={v => {
              setEmail(v)
              setError('')
              setNotice('')
            }}
            placeholder="you@company.com"
            autoComplete="username"
            error={error}
            disabled={loading}
          />

          {notice && <AuthAlert tone="info">{notice}</AuthAlert>}

          <SubmitButton loading={loading} loadingLabel="Sending verification code…">
            Send Verification Code
          </SubmitButton>
        </form>

        <p className="text-center text-xs sm:text-sm text-slate-500 font-normal mt-7 pt-6 border-t border-slate-200/80">
          Remembered it?{' '}
          <button type="button" onClick={onBack} className="text-blue-600 font-semibold hover:underline cursor-pointer">
            Back to Sign In →
          </button>
        </p>
      </AuthCard>
    </AuthShell>
  )
}
