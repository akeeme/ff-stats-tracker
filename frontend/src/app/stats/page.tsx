import { Suspense } from 'react'
import { StatsViewer } from '@/components/stats-viewer'

export default function StatsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading stats...</div>}>
      <StatsViewer />
    </Suspense>
  )
}
