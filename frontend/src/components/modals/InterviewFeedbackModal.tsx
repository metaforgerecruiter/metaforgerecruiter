import React, { useState } from 'react'
import { X, Calendar, Star, CheckCircle2 } from 'lucide-react'
import { Interview, InterviewStatus } from '../../types'
import { interviewsService } from '../../services/workspace.service'
import { apiErrorMessage } from '../pages/submissions/preamble'

interface InterviewFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  interview: Interview | null
  onSaveFeedback: (id: string, status: InterviewStatus, notes: string) => void
}

export function InterviewFeedbackModal({
  isOpen,
  onClose,
  interview,
  onSaveFeedback,
}: InterviewFeedbackModalProps) {
  const [rating, setRating] = useState(4)
  const [status, setStatus] = useState<InterviewStatus>('Confirmed')
  const [notes, setNotes] = useState(interview?.notes || '')
  const [recommendation, setRecommendation] = useState<'Strong Hire' | 'Hire' | 'Hold' | 'Reject'>('Hire')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen || !interview) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const rec =
        (status as string) === 'Cancelled'
          ? 'Rejected'
          : recommendation === 'Strong Hire' || recommendation === 'Hire'
          ? 'Passed'
          : recommendation === 'Reject'
          ? 'Rejected'
          : 'Hold'

      if ((status as string) === 'Cancelled') {

        await interviewsService.cancel(interview.id, { reason: notes || 'Interview cancelled' })
      } else {
        await interviewsService.submitFeedback(interview.id, {
          recommendation: rec,
          technicalScore: rating,
          feedbackNotes: `[Recommendation: ${recommendation} | Rating: ${rating}/5 Stars] ${notes}`,
          notes,
        })
      }

      onSaveFeedback(interview.id, status, `[Recommendation: ${recommendation} | Rating: ${rating}/5 Stars] ${notes}`)
      onClose()
    } catch (err) {
      setErrorMsg(apiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base font-sans">Interview Feedback</h3>
              <p className="text-xs text-slate-500 font-mono">{interview.candidate} · {interview.client}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-400">Position:</span> <span className="font-bold text-slate-900">{interview.position}</span>
            </div>
            <div>
              <span className="text-slate-400">Stage:</span> <span className="font-bold text-blue-600">{interview.stage}</span>
            </div>
          </div>

          {/* 5-Star Rating Component */}
          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold uppercase text-slate-600">Technical & Competency Rating</label>
            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-400 hover:scale-110 transition-transform"
                >
                  <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                </button>
              ))}
              <span className="text-xs font-mono font-bold text-slate-700 ml-2">{rating} / 5 Rating</span>
            </div>
          </div>

          {/* Recommendation Selector */}
          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold uppercase text-slate-600">Final Recommendation</label>
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {(['Strong Hire', 'Hire', 'Hold', 'Reject'] as const).map(rec => (
                <button
                  type="button"
                  key={rec}
                  onClick={() => setRecommendation(rec)}
                  className={`py-1.5 text-xs font-mono rounded-lg border transition-all ${
                    recommendation === rec
                      ? rec === 'Strong Hire' || rec === 'Hire'
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                        : rec === 'Hold'
                        ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-xs'
                        : 'bg-rose-600 text-white border-rose-600 font-bold shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {rec}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold uppercase text-slate-600">Update Interview Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as InterviewStatus)}
              className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-mono"
            >
              <option value="Confirmed">✓ Confirmed & Completed</option>
              <option value="Scheduled">⌛ Scheduled</option>
              <option value="Pending">⏳ Pending Client Feedback</option>
              <option value="Cancelled">❌ Cancelled</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold uppercase text-slate-600">Detailed Feedback & Evaluator Notes</label>
            <textarea
              rows={3}
              placeholder="Candidate demonstrated strong system architecture depth and clean coding standards..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-sans"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 text-xs font-mono text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 font-sans"
            >
              <CheckCircle2 className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Save Evaluation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

