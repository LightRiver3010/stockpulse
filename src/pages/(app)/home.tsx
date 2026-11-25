import { useState } from 'react'
import { AuthOverlay, signOut, useCronMonitor, useQuery, useUser } from 'deepspace'
import { ChevronDown, ChevronUp, ExternalLink, LogOut, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui'
import { WatchlistPicker } from '../../components/WatchlistPicker'
import { SCOPE_ID } from '../../constants'
import { SUPPORTED_STOCKS } from '../../lib/stocks'
import { SP500_STOCKS } from '../../lib/sp500'

const DEMO_TICKERS = ['AMZN', 'META', 'TSLA', 'GOOGL']

interface SummaryRecord {
  ticker: string
  companyName: string
  summary: string
  sentiment: string
  trend?: string
  keyTopics: string
  sourceUrls: string
  sourceCount: number
  generatedAt: number
}

interface WatchlistRecord {
  userId: string
  ticker: string
  addedAt: number
}

const SENTIMENT_STYLES: Record<string, string> = {
  positive: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  leaning_positive: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  mixed: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  leaning_negative: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  negative: 'bg-rose-500/15 text-rose-700 border-rose-500/30',
  neutral: 'bg-muted text-muted-foreground border-border',
}

const SENTIMENT_LABELS: Record<string, string> = {
  positive: 'Positive',
  leaning_positive: 'Leaning Positive',
  mixed: 'Mixed',
  leaning_negative: 'Leaning Negative',
  negative: 'Negative',
  neutral: 'Neutral',
}

const SENTIMENT_RANK: Record<string, number> = {
  negative: 1,
  leaning_negative: 2,
  mixed: 3,
  neutral: 3,
  leaning_positive: 4,
  positive: 5,
}

const TREND_DISPLAY: Record<string, { symbol: string; label: string; className: string }> = {
  improving: { symbol: '↑', label: 'Improving', className: 'text-emerald-600' },
  worsening: { symbol: '↓', label: 'Worsening', className: 'text-rose-600' },
  steady: { symbol: '—', label: 'Steady', className: 'text-muted-foreground' },
}

function formatRelativeTime(timestamp: number): string {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (diffSeconds < 60) return 'Just now'

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
}

function resolveTrend(latest: SummaryRecord, previous?: SummaryRecord): string {
  if (latest.trend && TREND_DISPLAY[latest.trend]) return latest.trend
  if (!previous) return 'steady'
  const diff = (SENTIMENT_RANK[latest.sentiment] ?? 3) - (SENTIMENT_RANK[previous.sentiment] ?? 3)
  if (diff > 0) return 'improving'
  if (diff < 0) return 'worsening'
  return 'steady'
}

function SummaryCard({ summaries }: { summaries: SummaryRecord[] }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSources, setShowSources] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const data = summaries[0]
  const prior = summaries.slice(1, 5)
  const trendKey = resolveTrend(data, prior[0])
  const trend = TREND_DISPLAY[trendKey] ?? TREND_DISPLAY.steady

  const topics = data.keyTopics
    ? data.keyTopics
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : []

  const sources = data.sourceUrls
    ? data.sourceUrls
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean)
    : []

  const sentimentStyle = SENTIMENT_STYLES[data.sentiment] ?? SENTIMENT_STYLES.neutral
  const sentimentLabel = SENTIMENT_LABELS[data.sentiment] ?? data.sentiment

  return (
    <div className="card-elevated rounded-lg border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        className="w-full p-4 text-left cursor-pointer space-y-2.5"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold tracking-tight text-foreground truncate">
              {data.companyName}
            </h3>
            <span className="font-mono text-xs font-medium text-muted-foreground">{data.ticker}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-xs font-medium inline-flex items-center gap-0.5 ${trend.className}`}
              title={`5-day trend: ${trend.label}`}
            >
              <span>{trend.symbol}</span>
              <span className="hidden sm:inline">{trend.label}</span>
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${sentimentStyle}`}
          >
            {sentimentLabel}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {formatRelativeTime(data.generatedAt)}
          </span>
        </div>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1 space-y-3 border-t">
            <p className="text-sm leading-relaxed text-foreground pt-2">{data.summary}</p>

            {topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {topics.map((topic) => (
                  <span
                    key={topic}
                    className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-2 border-t">
              <span>
                {data.sourceCount} {data.sourceCount === 1 ? 'source' : 'sources'}
              </span>

              <div className="flex items-center gap-3">
                {prior.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowHistory((prev) => !prev)}
                    className="inline-flex items-center gap-1 font-medium text-foreground hover:underline cursor-pointer"
                  >
                    {showHistory ? 'Hide history' : `History (${prior.length})`}
                    {showHistory ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
                {sources.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSources((prev) => !prev)}
                    className="inline-flex items-center gap-1 font-medium text-foreground hover:underline cursor-pointer"
                  >
                    {showSources ? 'Hide sources' : 'Sources'}
                    {showSources ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {showHistory && prior.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Recent Summary History
                </p>
                {prior.map((item) => {
                  const itemStyle = SENTIMENT_STYLES[item.sentiment] ?? SENTIMENT_STYLES.neutral
                  const itemLabel = SENTIMENT_LABELS[item.sentiment] ?? item.sentiment
                  return (
                    <div key={item.generatedAt} className="rounded-md bg-muted/40 p-2.5 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">
                          {new Date(item.generatedAt).toLocaleDateString()}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase ${itemStyle}`}
                        >
                          {itemLabel}
                        </span>
                      </div>
                      <p className="text-foreground leading-relaxed">{item.summary}</p>
                    </div>
                  )
                })}
              </div>
            )}

            {showSources && sources.length > 0 && (
              <ul className="space-y-1.5 pt-2 border-t text-xs">
                {sources.map((url) => (
                  <li key={url} className="truncate">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline max-w-full"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate">{url}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PendingSummaryCard({
  ticker,
  companyName,
  isFetching = false,
}: {
  ticker: string
  companyName: string
  isFetching?: boolean
}) {
  return (
    <div className="rounded-lg border border-dashed bg-card/50 p-4 space-y-1.5">
      <div className="min-w-0">
        <h3 className="font-display text-base font-bold tracking-tight text-foreground truncate">
          {companyName}
        </h3>
        <span className="font-mono text-xs font-medium text-muted-foreground">{ticker}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {isFetching
          ? 'Fetching current data right now...'
          : 'Awaiting first analysis - updates weekdays at 5:30 PM ET.'}
      </p>
    </div>
  )
}

function Dashboard() {
  const { user } = useUser()
  const { tasks: cronTasks } = useCronMonitor(SCOPE_ID)
  const { records: watchlistRecords, status: watchlistStatus } = useQuery<WatchlistRecord>('watchlist')
  const {
    records: summaryRecords,
    status: summaryStatus,
    error: summaryError,
  } = useQuery<SummaryRecord>('summaries', {
    orderBy: 'generatedAt',
    orderDir: 'desc',
  })
  const [fetchingTickers, setFetchingTickers] = useState<Set<string>>(new Set())
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Distinct tickers followed by the current user, or demo tickers for guests
  const followedTickers = user
    ? Array.from(
        new Set(
          watchlistRecords
            .filter((r) => r.data.userId === user.id)
            .map((r) => r.data.ticker.toUpperCase())
            .filter(Boolean),
        ),
      )
    : DEMO_TICKERS

  // Group up to 5 newest summaries per ticker (reverse chronological)
  const historyByTicker = new Map<string, SummaryRecord[]>()
  for (const r of summaryRecords) {
    const ticker = r.data.ticker.toUpperCase()
    const list = historyByTicker.get(ticker) ?? []
    list.push(r.data)
    historyByTicker.set(ticker, list)
  }
  for (const [ticker, list] of historyByTicker) {
    list.sort((a, b) => b.generatedAt - a.generatedAt)
    historyByTicker.set(ticker, list.slice(0, 5))
  }

  // Sort followed stocks: newest summaries first, pending tickers after
  const sortedFollowed = [...followedTickers].sort((a, b) => {
    const sumA = historyByTicker.get(a)?.[0]
    const sumB = historyByTicker.get(b)?.[0]
    if (sumA && sumB) return sumB.generatedAt - sumA.generatedAt
    if (sumA) return -1
    if (sumB) return 1
    return 0
  })

  const isLoading = watchlistStatus === 'loading' || summaryStatus === 'loading'
  const summarizeTask = cronTasks.find((t) => t.name === 'summarize-stocks')
  const lastRunText = summarizeTask?.lastRunAt
    ? `Last pipeline run: ${formatRelativeTime(new Date(summarizeTask.lastRunAt).getTime())}`
    : 'Last pipeline run: Not run yet'

  const handleTickerAdded = async (ticker: string) => {
    const normalized = ticker.toUpperCase()
    if ((historyByTicker.get(normalized)?.length ?? 0) > 0 || fetchingTickers.has(normalized)) return

    setFetchingTickers((prev) => new Set(prev).add(normalized))
    try {
      await fetch(`/api/pipeline/run?tickers=${encodeURIComponent(normalized)}`, {
        method: 'POST',
      })
    } catch (err) {
      console.error(`Failed to fetch summary for ${normalized}:`, err)
    } finally {
      setFetchingTickers((prev) => {
        const next = new Set(prev)
        next.delete(normalized)
        return next
      })
    }
  }

  const renderTickerCard = (ticker: string) => {
    const history = historyByTicker.get(ticker)
    if (history && history.length > 0) {
      return <SummaryCard key={ticker} summaries={history} />
    }
    const stockInfo =
      SUPPORTED_STOCKS.find((s) => s.ticker === ticker) ??
      SP500_STOCKS.find((s) => s.ticker.toUpperCase() === ticker)
    return (
      <PendingSummaryCard
        key={ticker}
        ticker={ticker}
        companyName={stockInfo?.name ?? ticker}
        isFetching={fetchingTickers.has(ticker)}
      />
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
      <header className="border-b border-border pb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">StockPulse</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Market news summaries powered by Exa and Claude.
          </p>
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right text-xs text-muted-foreground">
              <div className="font-medium text-foreground">{user.name || user.email}</div>
              {user.name && user.email && <div className="text-[11px]">{user.email}</div>}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="text-right text-xs text-muted-foreground">
              <div className="font-medium text-foreground">Guest</div>
              <div className="text-[11px]">Create an account to customize</div>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAuthModal(true)}
              className="gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Create account
            </Button>
          </div>
        )}
      </header>

      <WatchlistPicker onTickerAdded={handleTickerAdded} demoTickers={DEMO_TICKERS} />

      <div className="space-y-5">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
          {user ? 'Your Stock Summaries' : 'Demo Stock Summaries'}
        </h2>

        {isLoading && (
          <div className="space-y-3" aria-busy="true">
            <div className="rounded-lg border bg-card/50 p-5 text-sm text-muted-foreground">
              Loading your watchlist and summaries...
            </div>
          </div>
        )}

        {summaryError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Error loading summaries: {summaryError}
          </div>
        )}

        {!isLoading && !summaryError && followedTickers.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <p className="text-sm font-medium text-foreground">Your watchlist is empty</p>
            <p className="text-xs mt-1">Select stocks to follow from the list above.</p>
          </div>
        )}

        {!isLoading && sortedFollowed.length > 0 && (
          <>
            {/* Desktop 3-column layout: expanding a card pushes only its own column down */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-4 items-start">
              {[0, 1, 2].map((colIdx) => (
                <div key={colIdx} className="space-y-4">
                  {sortedFollowed
                    .filter((_, idx) => idx % 3 === colIdx)
                    .map(renderTickerCard)}
                </div>
              ))}
            </div>

            {/* Mobile / tablet fallback */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start lg:hidden">
              {sortedFollowed.map(renderTickerCard)}
            </div>
          </>
        )}
      </div>

      <footer className="pt-6 border-t border-border font-mono text-xs text-muted-foreground flex items-center justify-between">
        <span>{lastRunText}</span>
        <span>Updates weekdays at 5:30 PM ET</span>
      </footer>

      {showAuthModal && <AuthOverlay onClose={() => setShowAuthModal(false)} />}
    </div>
  )
}

export default function HomePage() {
  return <Dashboard />
}
