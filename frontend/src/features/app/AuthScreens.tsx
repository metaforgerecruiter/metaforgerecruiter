import React from 'react'
import { AuthScreen, Role } from '../../types'
import { LandingPage } from '../../components/landing/LandingPage'
import { SignInPage } from '../../components/auth/SignInPage'
import { SignUpPage } from '../../components/auth/SignUpRequestPage'
import { PasswordRecoveryFlow } from '../../components/auth/PasswordRecoveryFlow'

interface AuthScreensProps {
  screen: AuthScreen
  loginRole?: Role
  recoveryEmail: string
  setScreen: (screen: AuthScreen) => void
  setLoginRole?: (role: Role) => void
  setRecoveryEmail: (email: string) => void
  onAuthenticated: (role: Role) => void
}

export function AuthScreens({
  screen,
  recoveryEmail,
  setScreen,
  setRecoveryEmail,
  onAuthenticated,
}: AuthScreensProps) {
  if (screen === 'landing') {
    return (
      <LandingPage
        onSignIn={() => setScreen('signin')}
        onRequestAccess={() => setScreen('signup')}
      />
    )
  }

  if (screen === 'signin') {
    return (
      <SignInPage
        onLogin={onAuthenticated}
        onForgot={email => {
          setRecoveryEmail(email || '')
          setScreen('password-recovery')
        }}
        onSignup={() => setScreen('signup')}
        onBack={() => setScreen('landing')}
      />
    )
  }

  if (screen === 'signup') {
    return <SignUpPage onBack={() => setScreen('signin')} onSubmitted={() => setScreen('signin')} />
  }

  if (screen === 'password-recovery') {
    return <PasswordRecoveryFlow initialEmail={recoveryEmail} onExit={() => setScreen('signin')} />
  }

  return null
}
