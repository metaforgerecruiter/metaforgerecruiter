import React, { useState } from 'react'
import { Role } from '../../types'
import { isStrongPassword, isValidEmail, requestAccess } from '../../data/authService'
import { AuthCard, AuthShell } from './AuthShell'
import { SignUpRequestStep1 } from './SignUpRequestPage.step1'
import { SignUpRequestStep2, SignUpRequestSubmitted } from './SignUpRequestPage.step2'

interface SignUpPageProps {
  onBack: () => void
  onSubmitted: () => void
  onLogin?: (role: Role) => void
}

const REQUESTABLE_ROLES: Role[] = ['recruiter', 'lead', 'admin']

type Step = 1 | 2

export function SignUpPage({ onBack, onSubmitted, onLogin }: SignUpPageProps) {
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organization: '',
    role: 'recruiter' as Role,
    password: '',
    confirm: '',
    agree: false,
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '', general: '' }))
  }

  const validateStep1 = () => {
    const next: Record<string, string> = {}
    if (!form.firstName.trim()) next.firstName = 'First name is required'
    if (!form.lastName.trim()) next.lastName = 'Last name is required'
    if (!form.email.trim()) next.email = 'Work email is required'
    else if (!isValidEmail(form.email)) next.email = 'Enter a valid work email address'
    if (!form.organization.trim()) next.organization = 'Organization is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const validateStep2 = () => {
    const next: Record<string, string> = {}
    if (form.password) {
      if (!isStrongPassword(form.password)) next.password = 'Password does not meet all requirements'
      if (form.confirm !== form.password) next.confirm = 'Passwords do not match'
    }
    if (!form.agree) next.agree = 'You must accept the Terms of Service and Privacy Policy'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStep1()) setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep2()) return

    setSubmitting(true)
    try {
      await requestAccess({
        email: form.email.trim(),
        password: form.password ? form.password : undefined,
        name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        role: form.role,
        phone: form.phone.trim() || undefined,
      })
      setSubmitted(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to submit access request. Try again.'
      setErrors(prev => ({ ...prev, general: message }))
    } finally {
      setSubmitting(false)
    }
  }

  const shell = (children: React.ReactNode) => (
    <AuthShell
      wide
      backLabel="Back to sign in"
      onBack={onBack}
      eyebrow="Administrator-Approved Access"
      headline={
        <>
          Request access to
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            your organization&apos;s workspace.
          </span>
        </>
      }
      description="MRAP accounts are provisioned by your platform administrator. Submit your details and your workspace is activated with the right role and permissions."
      bullets={[
        'Requests are reviewed by your Super Admin or Admin',
        'Roles and permissions are assigned centrally via RBAC',
        'Your credentials stay encrypted until the account is activated',
      ]}
    >
      {children}
    </AuthShell>
  )

  if (submitted) {
    return shell(
      <SignUpRequestSubmitted
        organization={form.organization}
        email={form.email}
        role={form.role}
        onSubmitted={onSubmitted}
      />
    )
  }

  return shell(
    <AuthCard>
      <div className="flex items-center gap-3 mb-8">
        {([1, 2] as Step[]).map(s => (
          <div key={s} className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                step === s
                  ? 'bg-blue-600 text-white ring-4 ring-blue-600/15'
                  : step > s
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {step > s ? '✓' : s}
            </div>
            <span className={`text-xs font-mono font-semibold ${step === s ? 'text-slate-900' : 'text-slate-400'}`}>
              {s === 1 ? 'Profile Details' : 'Security Credentials'}
            </span>
            {s < 2 && <div className="w-8 h-px bg-slate-200 mx-1" />}
          </div>
        ))}
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans tracking-tight mb-2">
        {step === 1 ? 'Request enterprise access' : 'Create your password'}
      </h2>
      <p className="text-sm text-slate-500 font-normal mb-8 leading-relaxed">
        {step === 1
          ? 'Tell us who you are and which workspace role you need. Your administrator approves the request.'
          : 'Set the credentials you will use to sign in once your account is activated.'}
      </p>

      {step === 1 && (
        <SignUpRequestStep1
          form={form}
          set={set as any}
          errors={errors}
          requestableRoles={REQUESTABLE_ROLES}
          onBack={onBack}
          onNext={handleNext}
          onQuickLogin={onLogin}
        />
      )}

      {step === 2 && (
        <SignUpRequestStep2
          form={form}
          set={set as any}
          errors={errors}
          submitting={submitting}
          onBackStep={() => setStep(1)}
          onSubmit={handleSubmit}
        />
      )}
    </AuthCard>
  )
}
