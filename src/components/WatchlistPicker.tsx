import { useState } from 'react'
import { useMutations, useQuery, useUser } from 'deepspace'
import { SUPPORTED_STOCKS, type SupportedStock } from '../lib/stocks'

interface WatchlistRecord {
  userId: string
  ticker: string
  addedAt: number
}

export function WatchlistPicker() {
  const { user } = useUser()
  const { records: watchlistRecords } = useQuery<WatchlistRecord>('watchlist')
  const { create, remove, ready } = useMutations<WatchlistRecord>('watchlist')
  const [pendingTickers, setPendingTickers] = useState<Set<string>>(new Set())

  if (!user) return null

  // Map of followed ticker -> recordId for the current user
  const watchedMap = new Map<string, string>()
  for (const r of watchlistRecords) {
    if (r.data.userId === user.id) {
      watchedMap.set(r.data.ticker, r.recordId)
    }
  }

  const handleToggle = async (stock: SupportedStock) => {
    if (!ready || pendingTickers.has(stock.ticker)) return

    setPendingTickers((prev) => new Set(prev).add(stock.ticker))
    try {
      const existingRecordId = watchedMap.get(stock.ticker)
      if (existingRecordId) {
        await remove(existingRecordId)
      } else {
        await create({
          userId: user.id,
          ticker: stock.ticker,
          addedAt: Date.now(),
        })
      }
    } catch (err) {
      console.error(`Failed to update watchlist for ${stock.ticker}:`, err)
    } finally {
      setPendingTickers((prev) => {
        const next = new Set(prev)
        next.delete(stock.ticker)
        return next
      })
    }
  }

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Your Watchlist</h2>
          <p className="text-xs text-muted-foreground">
            Select the stocks you want to follow.
          </p>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
          {watchedMap.size} of {SUPPORTED_STOCKS.length} selected
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {SUPPORTED_STOCKS.map((stock) => {
          const isWatched = watchedMap.has(stock.ticker)
          const isPending = pendingTickers.has(stock.ticker)

          return (
            <label
              key={stock.ticker}
              className={`flex items-center gap-2.5 p-2.5 rounded-md border text-sm cursor-pointer transition-colors select-none ${
                isWatched
                  ? 'border-primary/50 bg-primary/5 text-foreground font-medium'
                  : 'border-border bg-background hover:bg-muted/50 text-muted-foreground'
              } ${isPending || !ready ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                checked={isWatched}
                disabled={isPending || !ready}
                onChange={() => handleToggle(stock)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="flex flex-col truncate">
                <span className="font-semibold text-xs leading-none text-foreground">{stock.ticker}</span>
                <span className="text-[11px] text-muted-foreground truncate">{stock.name}</span>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}
