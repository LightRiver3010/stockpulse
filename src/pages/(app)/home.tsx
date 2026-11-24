import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthGate, AuthOverlay, useQuery, useUser } from 'deepspace'
import { Button } from '@/components/ui'
import { WatchlistPicker } from '../../components/WatchlistPicker'

interface SummaryRecord {
  ticker: string
  companyName: string
  summary: string
  sentiment: string
  keyTopics: string
  sourceUrls: string
  sourceCount: number
  generatedAt: number
}

function SignedOutPanel() {
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-20">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">Sign in to continue</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          StockPulse summaries and personalized watchlists are available to signed-in users.
        </p>
        <Button className="mt-6 w-full" onClick={() => setShowAuthModal(true)}>
          Sign in
        </Button>
        <Link
          to="/"
          className="mt-4 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Back to landing
        </Link>
      </div>

      {showAuthModal && <AuthOverlay onClose={() => setShowAuthModal(false)} />}
    </div>
  )
}

function Dashboard() {
  const { user } = useUser()
  const { records, status, error } = useQuery<SummaryRecord>('summaries')

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="border-b pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">StockPulse</h1>
          <p className="text-sm text-muted-foreground">
            Market news summaries powered by Exa and Claude.
          </p>
        </div>
        {user && (
          <div className="text-right text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{user.name || user.email}</span>
            <div className="font-mono text-[10px] opacity-75">{user.id}</div>
          </div>
        )}
      </div>

      {/* Watchlist selection */}
      <WatchlistPicker />

      {/* Summaries list */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Latest Market Summaries</h2>

        {status === 'loading' && (
          <p className="text-sm text-muted-foreground">Loading summaries from Records...</p>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Error loading summaries: {error}
          </div>
        )}

        {status === 'ready' && records.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <p>No stock summaries saved yet.</p>
            <p className="text-xs mt-1">
              Trigger the pipeline at <code>/api/test-exa</code> to generate and store your first summary.
            </p>
          </div>
        )}

        {records.map((r) => (
          <div key={r.recordId} className="rounded-lg border bg-card p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">
                {r.data.ticker}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  ({r.data.companyName})
                </span>
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded uppercase tracking-wider ${
                  r.data.sentiment === 'positive'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : r.data.sentiment === 'negative'
                      ? 'bg-rose-500/10 text-rose-600'
                      : r.data.sentiment === 'mixed'
                        ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-muted text-muted-foreground'
                }`}
              >
                {r.data.sentiment}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-foreground">{r.data.summary}</p>

            {r.data.keyTopics && (
              <p className="text-xs text-muted-foreground pt-1">
                <strong className="text-foreground">Key topics:</strong> {r.data.keyTopics}
              </p>
            )}

            <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
              <span>{r.data.sourceCount} sources analyzed</span>
              <span>{new Date(r.data.generatedAt).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <AuthGate fallback={<SignedOutPanel />}>
      <Dashboard />
    </AuthGate>
  )
}
