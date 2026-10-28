import React, { useEffect, useRef, useState } from 'react'
import { MailCheck, ShieldCheck } from 'lucide-react'
import { VERIFICATION_CODE_LENGTH } from '../../data/authService'
import { AuthCard, AuthIconTile, AuthShell } from './AuthShell'
import { AuthAlert, SubmitButton } from './AuthFormControls'
import { VerifyCodeInputs } from './VerifyCodePage.inputs'

interface VerifyCodePageProps {
  email: string
  /** Optional legacy parameter, not displayed on screen */
  expectedCode?: string
  onVerified: (code: string) => void | Promise<void>
  onResend: () => void | Promise<void>
  /** Back to the email entry step */
  onBack: () => void
}

const RESEND_SECONDS = 60

export function VerifyCodePage({ email, onVerified, onResend, onBack }: VerifyCodePageProps) {
  const [digits, setDigits] = useState<string[]>(Array(VERIFICATION_CODE_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = window.setInterval(() => setSecondsLeft(s => (s <= 1 ? 0 : s - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [secondsLeft])

  const code = digits.join('')

  const writeDigits = (next: string[]) => {
    setDigits(next)
    setError('')
  }

  const handleChange = (index: number, raw: string) => {
    const value = raw.replace(/\D/g, '')
    if (!value) {
      const next = [...digits]
      next[index] = ''
      writeDigits(next)
      return
    }

    const next = [...digits]
    // Support pasting / fast typing of multiple digits at once
    value.split('').forEach((char, offset) => {
      if (index + offset < VERIFICATION_CODE_LENGTH) next[index + offset] = char
    })
    writeDigits(next)

    const focusAt = Math.min(index + value.length, VERIFICATION_CODE_LENGTH - 1)
    inputs.current[focusAt]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < VERIFICATION_CODE_LENGTH - 1) inputs.current[index + 1]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (code.length < VERIFICATION_CODE_LENGTH) {
      setError(`Enter all ${VERIFICATION_CODE_LENGTH} digits of your verification code`)
      return
    }

    setError('')
    setLoading(true)
    try {
      await onVerified(code)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That verification code is incorrect or has expired. Request a new code and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setDigits(Array(VERIFICATION_CODE_LENGTH).fill(''))
    setError('')
    inputs.current[0]?.focus()
    try {
      await onResend()
      setSecondsLeft(RESEND_SECONDS)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification code.')
    }
  }

  return (
    <AuthShell
      backLabel="Change email address"
      onBack={onBack}
      eyebrow="Two-Step Verification"
      headline={
        <>
          Verify your corporate
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            email login code.
          </span>
        </>
      }
      description="A single-use 4-digit verification code was sent to your registered corporate email."
      bullets={[
        'Codes are valid for 5 minutes and single-use only',
        'Failed attempts are limited to protect your account',
        'Secure token session issued upon verification',
      ]}
    >
      <AuthCard>
        <AuthIconTile icon={MailCheck} tone="blue" />

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans tracking-tight mb-2">
          Check your inbox
        </h2>
        <p className="text-sm text-slate-500 mb-8 font-normal leading-relaxed">
          We sent a {VERIFICATION_CODE_LENGTH}-digit verification code to{' '}
          <span className="text-slate-900 font-semibold">{email}</span>. Enter it below to complete your login.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <VerifyCodeInputs
            digits={digits}
            error={error}
            loading={loading}
            inputs={inputs}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />

          {error && <AuthAlert tone="error">{error}</AuthAlert>}

          <SubmitButton loading={loading} loadingLabel="Verifying code…">
            Verify & Sign In
          </SubmitButton>
        </form>

        <div className="mt-7 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-xs text-slate-500 font-medium">Didn&apos;t receive the code?</span>
          {secondsLeft > 0 ? (
            <span className="text-xs font-mono text-slate-400">Resend available in {secondsLeft}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-xs text-blue-600 font-semibold hover:underline text-left cursor-pointer"
            >
              Resend verification code →
            </button>
          )}
        </div>
      </AuthCard>
    </AuthShell>
  )
}
