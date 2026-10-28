import React, { useState } from 'react'
import { Check, Pencil, User, Mail, Briefcase, Lock, Eye, EyeOff, KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react'

interface MyProfileDetailsCardProps {
  name: string
  email: string
  roleLabel: string
  isEditing: boolean
  editName: string
  editEmail: string
  setEditName: (value: string) => void
  setEditEmail: (value: string) => void
  onStartEdit: () => void
  onSave: (e: React.FormEvent) => void
  onCancel: () => void
}

export function MyProfileDetailsCard({
  name,
  email,
  roleLabel,
  isEditing,
  editName,
  editEmail,
  setEditName,
  setEditEmail,
  onStartEdit,
  onSave,
  onCancel,
}: MyProfileDetailsCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-100/90 text-slate-400 flex items-center justify-center border border-slate-200/60 shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Personal Details
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Your personal details and account information
            </p>
          </div>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={onStartEdit}
            className="px-4 py-2 bg-[#6B3BF6] hover:bg-[#5833E0] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-98"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#6B3BF6] focus:bg-white transition-all"
                placeholder="Enter full name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#6B3BF6] focus:bg-white transition-all"
                placeholder="Enter email address"
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#6B3BF6] hover:bg-[#5833E0] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/60">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Name</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{name}</div>
            </div>
          </div>
          <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100/60">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Email</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{email}</div>
            </div>
          </div>
          <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/60">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Role</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{roleLabel}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface ChangePasswordCardProps {
  newPass: string
  setNewPass: (val: string) => void
  confirmPass: string
  setConfirmPass: (val: string) => void
  isChangingPass: boolean
  passError: string | null
  onPasswordSubmit: (e: React.FormEvent) => void
}

export function ChangePasswordCard({
  newPass,
  setNewPass,
  confirmPass,
  setConfirmPass,
  isChangingPass,
  passError,
  onPasswordSubmit,
}: ChangePasswordCardProps) {
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [isEditingPass, setIsEditingPass] = useState(false)

  const rules = [
    { label: 'At least 8 characters', valid: newPass.length >= 8 },
    { label: 'One uppercase letter (A-Z)', valid: /[A-Z]/.test(newPass) },
    { label: 'One lowercase letter (a-z)', valid: /[a-z]/.test(newPass) },
    { label: 'One number (0-9)', valid: /[0-9]/.test(newPass) },
    { label: 'One special character (!@#$...)', valid: /[^A-Za-z0-9]/.test(newPass) },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Security Credentials & Password
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              OTP login remains active. You can edit or change your account password anytime below.
            </p>
          </div>
        </div>

        {!isEditingPass && (
          <button
            type="button"
            onClick={() => setIsEditingPass(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-98"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Change Password</span>
          </button>
        )}
      </div>

      {!isEditingPass ? (
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900">Email OTP Login Enabled</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Primary login uses verification codes sent directly to your work email.</div>
            </div>
          </div>
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200/80 shrink-0">
            Password Fallback Supported
          </span>
        </div>
      ) : (
        <form onSubmit={onPasswordSubmit} className="space-y-5 animate-in fade-in duration-150">
          {passError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">New Password</label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#6B3BF6] focus:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#6B3BF6] focus:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
            <span className="text-[11px] font-bold text-slate-600 block">Password Requirements:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {rules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                  {rule.valid ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 inline-block" />
                  )}
                  <span className={rule.valid ? 'text-emerald-900 font-bold' : 'text-slate-500'}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setNewPass('')
                setConfirmPass('')
                setIsEditingPass(false)
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isChangingPass}
              className="px-5 py-2 bg-[#6B3BF6] hover:bg-[#5833E0] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isChangingPass ? 'Updating Password...' : 'Save New Password'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
