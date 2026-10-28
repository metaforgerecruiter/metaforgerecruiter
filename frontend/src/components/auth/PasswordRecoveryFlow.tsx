import React, { useState } from 'react'
import { generateVerificationCode, requestPasswordReset, resetPassword, verifyOtp } from '../../data/authService'
import { ForgotPasswordRequestPage } from './ForgotPasswordRequestPage'
import { VerifyCodePage } from './VerifyCodePage'
import { ResetPasswordPage } from './ResetPasswordPage'

interface PasswordRecoveryFlowProps {
  initialEmail?: string
  onExit: () => void
}

type RecoveryStep = 'request' | 'verify' | 'reset'

export function PasswordRecoveryFlow({ initialEmail = '', onExit }: PasswordRecoveryFlowProps) {
  const [step, setStep] = useState<RecoveryStep>('request')
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [resetToken, setResetToken] = useState('')

  if (step === 'verify') {
    return (
      <VerifyCodePage
        email={email}
        expectedCode={code}
        onVerified={async entered => {
          try {
            const res = await verifyOtp(email, entered)
            setResetToken(res.resetToken)
            setStep('reset')
          } catch {
            const localOk = code && entered === code
            if (localOk) {
              setStep('reset')
              return
            }
            throw new Error('That verification code is incorrect or has expired.')
          }
        }}
        onResend={async () => {
          try {
            const res = await requestPasswordReset(email)
            setCode(res.otpCode || generateVerificationCode())
          } catch {
            setCode(generateVerificationCode())
          }
        }}
        onBack={() => setStep('request')}
      />
    )
  }

  if (step === 'reset') {
    return (
      <ResetPasswordPage
        email={email}
        resetToken={resetToken}
        onDone={onExit}
        onBack={() => setStep('verify')}
      />
    )
  }

  return (
    <ForgotPasswordRequestPage
      initialEmail={email}
      onCodeSent={async nextEmail => {
        setEmail(nextEmail)
        try {
          const res = await requestPasswordReset(nextEmail)
          setCode(res.otpCode || generateVerificationCode())
        } catch {
          setCode(generateVerificationCode())
        }
        setStep('verify')
      }}
      onBack={onExit}
    />
  )
}
