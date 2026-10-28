import React, { useState } from 'react'
import { Sparkles, RefreshCw, X, ChevronUp, UserCheck, Shield } from 'lucide-react'
import { Role } from '../../types'
import { DEMO_ACCOUNTS, DemoAccount, ENABLE_DEV_ACCOUNTS_UI } from '../../config/demoAccounts'
import { quickDevLogin } from '../../data/authService'

interface DevRoleSwitcherProps {
  currentRole: Role
  currentUserName?: string
  onSwitchRole: (role: Role) => void
}

/**
 * Floating Dev Role Switcher
 * Allows rapid switching between roles (Super Admin, Admin, Team Lead, Recruiter, Dev Team)
 * while paired or testing inside the active application.
 *
 * Can be disabled by setting ENABLE_DEV_ACCOUNTS_UI = false in config/demoAccounts.ts
 * or by removing from App.tsx before deployment.
 */
export function DevRoleSwitcher({
  currentRole,
  currentUserName,
  onSwitchRole,
}: DevRoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [switchingId, setSwitchingId] = useState<string | null>(null)
  const [minimized, setMinimized] = useState(false)

  if (!ENABLE_DEV_ACCOUNTS_UI) {
    return null
  }

  const handleSwitch = async (account: DemoAccount) => {
    if (account.role === currentRole && switchingId === null) {
      setIsOpen(false)
      return
    }
    setSwitchingId(account.id)
    try {
      const res = await quickDevLogin(account)
      if (res.ok) {
        onSwitchRole(res.account.role)
        setIsOpen(false)
      }
    } finally {
      setSwitchingId(null)
    }
  }

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-50 px-2.5 py-1.5 rounded-full bg-slate-900/90 text-white shadow-xl text-[10px] font-mono font-bold flex items-center gap-1.5 hover:bg-black transition-all cursor-pointer border border-slate-700 backdrop-blur-md"
        title="Restore Dev Role Switcher"
      >
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>Dev Switcher</span>
      </button>
    )
  }

  const currentAccount = DEMO_ACCOUNTS.find(a => a.role === currentRole)

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans">
      {isOpen && (
        <div className="mb-2 w-72 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-slate-200/90 overflow-hidden text-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold font-mono tracking-wide">
                Dev Account Switcher
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2 space-y-1.5 max-h-[380px] overflow-y-auto">
            <p className="text-[10px] text-slate-500 font-mono px-2 py-0.5">
              Switch role instantly without signing out:
            </p>

            {DEMO_ACCOUNTS.map((acc) => {
              const isActive = acc.role === currentRole
              const isSwitching = switchingId === acc.id

              return (
                <button
                  key={acc.id}
                  onClick={() => handleSwitch(acc)}
                  disabled={Boolean(switchingId)}
                  className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 border border-blue-300 ring-2 ring-blue-500/20'
                      : 'hover:bg-slate-100/80 border border-transparent'
                  } ${isSwitching ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{acc.avatar}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${acc.theme.badgeBg} ${acc.theme.badgeText}`}>
                          {acc.roleNumber}. {acc.roleLabel}
                        </span>
                        {isActive && (
                          <span className="text-[9px] font-bold text-blue-600 font-mono uppercase bg-blue-100 px-1 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-900 truncate mt-0.5">
                        {acc.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        {acc.email}
                      </p>
                    </div>
                  </div>

                  {isSwitching && (
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0 ml-1" />
                  )}
                </button>
              )
            })}
          </div>

          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Removable for deploy</span>
            <button
              onClick={() => setMinimized(true)}
              className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Minimize
            </button>
          </div>
        </div>
      )}

      {/* Floating pill button */}
      <div className="flex items-center gap-1 shadow-2xl rounded-full bg-slate-900/95 text-white p-1 border border-slate-700/80 backdrop-blur-md">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-800 transition-colors cursor-pointer text-xs font-bold"
        >
          <span className="text-sm">{currentAccount?.avatar || '⚡'}</span>
          <span className="text-amber-400 font-mono font-bold text-[11px]">Dev:</span>
          <span className="font-semibold text-slate-100">
            {currentAccount?.roleLabel || currentRole}
          </span>
          <ChevronUp className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <button
          onClick={() => setMinimized(true)}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Minimize switcher"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
