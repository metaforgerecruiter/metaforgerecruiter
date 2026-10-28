import React from 'react'

/** Full-width page wrapper — no side gutters / max-width cap */
export function PageContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`w-full max-w-none ${className}`}>{children}</div>
}
