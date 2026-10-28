'use client'

import dynamic from 'next/dynamic'
import { ErrorBoundary } from '../components/common/ErrorBoundary'

const App = dynamic(() => import('../features/app'), { ssr: false })

/** Existing SPA shell — inner navigation remains state-based (ROLE_NAV). */
export default function HomePage() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
}
