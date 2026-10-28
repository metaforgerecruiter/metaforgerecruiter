import React from 'react'
import { VERIFICATION_CODE_LENGTH } from '../../data/authService'

interface VerifyCodeInputsProps {
  digits: string[]
  error: string
  loading: boolean
  inputs: React.MutableRefObject<Array<HTMLInputElement | null>>
  onChange: (index: number, raw: string) => void
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void
}

export function VerifyCodeInputs({ digits, error, loading, inputs, onChange, onKeyDown }: VerifyCodeInputsProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
        Verification Code
      </label>
      <div className="flex gap-2 sm:gap-3">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={el => {
              inputs.current[i] = el
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={VERIFICATION_CODE_LENGTH}
            value={digit}
            disabled={loading}
            aria-label={`Digit ${i + 1}`}
            onChange={e => onChange(i, e.target.value)}
            onKeyDown={e => onKeyDown(i, e)}
            className={`flex-1 min-w-0 h-14 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono text-slate-900 bg-slate-50/70 border rounded-xl focus:outline-none transition-all disabled:opacity-60 ${
              error
                ? 'border-rose-400 bg-rose-50/50'
                : 'border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
