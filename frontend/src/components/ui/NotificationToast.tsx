import React from 'react'
import { Bell, Calendar, UserCheck, CheckCircle2, AlertCircle, X } from 'lucide-react'

export interface ToastItem {
  id: string
  title: string
  message: string
  type: string
  createdAt?: string
}

interface NotificationToastProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

export function NotificationToast({ toasts, onDismiss }: NotificationToastProps) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white rounded-xl p-4 shadow-2xl border border-slate-700/60 flex items-start gap-3 transform transition-all duration-300 animate-in fade-in slide-in-from-top-4"
        >
          <div className="mt-0.5 flex-shrink-0">
            {toast.type === 'interview' || toast.type === 'interview_scheduled' ? (
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <Calendar className="w-4 h-4" />
              </div>
            ) : toast.type === 'submission' || toast.type === 'submission_approved' || toast.type === 'lead_approval_requested' ? (
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <UserCheck className="w-4 h-4" />
              </div>
            ) : toast.type === 'placement' || toast.type === 'offer_released' || toast.type === 'candidate_placed' ? (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Bell className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-white truncate font-sans">{toast.title}</h4>
              <button
                onClick={() => onDismiss(toast.id)}
                className="text-slate-400 hover:text-white transition-colors p-0.5 rounded"
                title="Dismiss pop-up"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-snug line-clamp-2 font-body">{toast.message}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
