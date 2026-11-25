import { useState } from 'react'
import { useMutations, useQuery, useUser } from 'deepspace'
import { Search, X } from 'lucide-react'
import { SUPPORTED_STOCKS } from '../lib/stocks'
import { SP500_STOCKS, type SP500Stock } from '../lib/sp500'

export const MAX_WATCHLIST_SIZE = 10

interface WatchlistRecord {
  userId: string
  ticker: string
  addedAt: number
}

interface WatchlistPickerProps {
  onTickerAdded?: (ticker: string) => void
  demoTickers?: string[]
}

const COMPANY_NAME_BY_TICKER = new Map<string, string>([
  ...SP500_STOCKS.map((s): [string, string] => [s.ticker.toUpperCase(), s.name]),
  ...SUPPORTED_STOCKS.map((s): [string, string] => [s.ticker.toUpperCase(), s.name]),
])

export function WatchlistPicker({
  onTickerAdded,
  demoTickers = ['AMZN', 'META', 'TSLA', 'GOOGL'],
}: WatchlistPickerProps) {
  const { user } = useUser()
  const { records: watchlistRecords } = useQuery<WatchlistRecord>('watchlist')
  const { create, remove, ready } = useMutations<WatchlistRecord>('watchlist')
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingTickers, setPendingTickers] = useState<Set<string>>(new Set())

  const isGuest = !user

  const watchedMap = new Map<string, string>()
  if (user) {
    for (const r of watchlistRecords) {
      if (r.data.userId === user.id) {
        watchedMap.set(r.data.ticker.toUpperCase(), r.recordId)
      }
    }
  }

  const trimmedQuery = searchQuery.trim().toLowerCase()
  const filteredMatches: SP500Stock[] = trimmedQuery
    ? SP500_STOCKS.filter(
        (s) =>
          s.ticker.toLowerCase().includes(trimmedQuery) ||
          s.name.toLowerCase().includes(trimmedQuery),
      )
        .sort((a, b) => {
          const aPrefix = a.ticker.toLowerCase().startsWith(trimmedQuery) ? 0 : 1
          const bPrefix = b.ticker.toLowerCase().startsWith(trimmedQuery) ? 0 : 1
          return aPrefix - bPrefix
        })
        .slice(0, 8)
    : []

  const isAtLimit = watchedMap.size >= MAX_WATCHLIST_SIZE

  const addTicker = async (ticker: string) => {
    const normalized = ticker.toUpperCase()
    if (isGuest || !user || !ready || isAtLimit || watchedMap.has(normalized) || pendingTickers.has(normalized)) return

    setPendingTickers((prev) => new Set(prev).add(normalized))
    try {
      await create({
        userId: user.id,
        ticker: normalized,
        addedAt: Date.now(),
      })
      setSearchQuery('')
      onTickerAdded?.(normalized)
    } catch (err) {
      console.error(`Failed to add ${normalized} to watchlist:`, err)
    } finally {
      setPendingTickers((prev) => {
        const next = new Set(prev)
        next.delete(normalized)
        return next
      })
    }
  }

  const removeTicker = async (ticker: string) => {
    const normalized = ticker.toUpperCase()
    const recordId = watchedMap.get(normalized)
    if (isGuest || !ready || !recordId || pendingTickers.has(normalized)) return

    setPendingTickers((prev) => new Set(prev).add(normalized))
    try {
      await remove(recordId)
    } catch (err) {
      console.error(`Failed to remove ${normalized} from watchlist:`, err)
    } finally {
      setPendingTickers((prev) => {
        const next = new Set(prev)
        next.delete(normalized)
        return next
      })
    }
  }

  const watchedEntries = isGuest ? demoTickers : Array.from(watchedMap.keys())

  return (
    <div className={`rounded-lg border bg-card p-5 shadow-sm space-y-4 ${isGuest ? 'opacity-75' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {isGuest ? 'Demo Watchlist' : 'Your Watchlist'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isGuest
              ? 'Demo mode — create an account to customize your own watchlist (up to 10 stocks).'
              : `Search any S&P 500 stock or pick from popular tickers below (up to ${MAX_WATCHLIST_SIZE}).`}
          </p>
        </div>
        <span className="font-mono text-xs font-medium px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground shrink-0">
          {isGuest ? `Demo (${watchedEntries.length})` : `${watchedEntries.length} / ${MAX_WATCHLIST_SIZE} max`}
        </span>
      </div>

      {!isGuest && isAtLimit && (
        <p className="text-xs text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
          Maximum of {MAX_WATCHLIST_SIZE} stocks reached. Remove one to add another.
        </p>
      )}

      {/* Autocomplete search input */}
      <div className={`relative ${isGuest ? 'pointer-events-none select-none opacity-60' : ''}`}>
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isGuest
                ? 'Sign in to search and add S&P 500 stocks...'
                : 'Search S&P 500 ticker or company (e.g. NVDA, Netflix)...'
            }
            disabled={isGuest || !ready}
            className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
          />
        </div>

        {trimmedQuery.length > 0 && (
          <div className="mt-1.5 rounded-md border border-border bg-background shadow-md divide-y divide-border overflow-hidden">
            {filteredMatches.length === 0 ? (
              <div className="px-3 py-2.5 text-xs text-muted-foreground">
                No matching S&P 500 stocks found for &ldquo;{searchQuery.trim()}&rdquo;.
              </div>
            ) : (
              filteredMatches.map((stock) => {
                const alreadyWatched = watchedMap.has(stock.ticker.toUpperCase())
                const isPending = pendingTickers.has(stock.ticker.toUpperCase())

                return (
                  <button
                    key={stock.ticker}
                    type="button"
                    disabled={alreadyWatched || isAtLimit || isPending || !ready}
                    onClick={() => addTicker(stock.ticker)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/60 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <div>
                      <span className="font-mono font-semibold text-foreground">{stock.ticker}</span>{' '}
                      <span className="text-muted-foreground text-xs">{stock.name}</span>
                    </div>
                    <span className="text-xs font-medium text-primary">
                      {alreadyWatched ? 'Following' : '+ Add'}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Currently watched chips */}
      {watchedEntries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {watchedEntries.map((ticker) => {
            const isPending = pendingTickers.has(ticker)
            const name = COMPANY_NAME_BY_TICKER.get(ticker)
            return (
              <span
                key={ticker}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                  isGuest
                    ? 'border-border bg-muted/60 text-muted-foreground'
                    : 'border-primary/40 bg-primary/5 text-foreground'
                }`}
              >
                <span className="font-mono font-semibold">{ticker}</span>
                {name && <span className="text-muted-foreground hidden sm:inline">({name})</span>}
                {!isGuest && (
                  <button
                    type="button"
                    disabled={isPending || !ready}
                    onClick={() => removeTicker(ticker)}
                    aria-label={`Remove ${ticker}`}
                    className="rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            )
          })}
        </div>
      )}

      {/* Quick-add starter stocks */}
      <div className={`pt-1 border-t ${isGuest ? 'pointer-events-none select-none opacity-50' : ''}`}>
        <p className="text-[11px] text-muted-foreground mb-2">Quick-add popular stocks:</p>
        <div className="flex flex-wrap gap-1.5">
          {SUPPORTED_STOCKS.filter((s) =>
            isGuest ? !demoTickers.includes(s.ticker) : !watchedMap.has(s.ticker),
          ).map((stock) => {
            const isPending = pendingTickers.has(stock.ticker)
            return (
              <button
                key={stock.ticker}
                type="button"
                disabled={isGuest || isAtLimit || isPending || !ready}
                onClick={() => addTicker(stock.ticker)}
                className="rounded-md border border-border bg-background px-2.5 py-1 font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + {stock.ticker}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
