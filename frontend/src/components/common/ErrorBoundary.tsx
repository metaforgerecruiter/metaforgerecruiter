'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/** Preserved from the original Vite `main.tsx` error overlay. */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-4">
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold border border-rose-500/30">
              ⚠️
            </div>
            <h1 className="text-xl font-extrabold text-white">Application Refresh Required</h1>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              A temporary rendering update occurred during live development. Click below to reset session and reload cleanly.
            </p>
            {this.state.error && (
              <div className="p-3 bg-slate-950 rounded-xl text-[10px] text-rose-300 font-mono text-left overflow-x-auto max-h-24 border border-rose-900/50">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full py-3 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-extrabold rounded-2xl shadow-lg transition-all cursor-pointer active:scale-98"
            >
              Reset Session & Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
