# StockPulse — Project Context

## What This Is
StockPulse is a personal stock news summarizer built entirely on DeepSpace (deep.space). A cron-triggered backend pipeline searches for recent articles about watched stocks, summarizes them with an LLM, and displays structured results on a React dashboard. Deployed to `stockpulse.app.space`.

## DeepSpace Products Used
- **Auth** — Google/GitHub sign-in via AuthGate, platform-minted JWTs
- **Records** — SQLite-backed collections for watchlist and summaries, real-time sync via useQuery
- **Integration Proxy (Exa)** — Article search with content extraction, date filtering, 5 articles per ticker max
- **AI Integration (Claude)** — Summarization with structured JSON output (summary, sentiment, keyTopics, sourceUrls)
- **Cron** — Every 4 hours, triggers the pipeline. Triggered manually during development.
- **File Storage (R2)** — Stretch goal only; raw article archival

## Data Schema
- **watchlist**: userId (string), ticker (string), addedAt (timestamp). Private per user (server-side access rules).
- **summaries**: ticker (string), companyName (string), summary (string), sentiment (positive/negative/neutral/mixed), keyTopics (string[]), sourceUrls (string[]), sourceCount (number), generatedAt (timestamp). Readable by any authenticated user, writable by system/worker only. One summary per ticker, shared across all users.

## Architecture Decisions
- No DOs for fan-out in MVP; single cron worker processes tickers sequentially with per-ticker try/catch.
- MVP uses a hardcoded list of 8-10 supported stocks (AAPL, NVDA, GOOGL, AMZN, MSFT, TSLA, META, JPM). Exa searches use company names, not ticker symbols, to avoid ambiguity.
- Free-text ticker input is a stretch goal. Static S&P 500 autocomplete is an intermediate upgrade.
- Summaries are global (not per-user). If 5 users follow AAPL, the pipeline generates one summary.
- Cost controls: MAX_ARTICLES_PER_TICKER = 5, MAX_TICKERS_PER_RUN = 10, CRON_INTERVAL_HOURS = 4.
- LLM output is validated (JSON parse, sentiment enum check, non-empty fields) before database write. Failures skip the ticker and preserve the previous summary.

## Implementation Order
1. Scaffold project and deploy immediately (catch config issues early)
2. Test Exa search for one hardcoded ticker, inspect response format
3. Build LLM summarization, validate structured JSON output
4. Save validated summary to Records, display on screen (first vertical slice)
5. Add Auth (AuthGate), build watchlist picker from supported stocks list
6. Expand pipeline to all watched tickers with per-ticker error isolation
7. Attach cron trigger, add useCronMonitor to frontend
8. Polish dashboard (sentiment colors, key topics tags, last-updated timestamps)

## Stretch Goals (in priority order)
1. Static S&P 500 ticker autocomplete replacing the fixed picker
2. Free-text ticker input
3. Summary history (last 3-5 per ticker) with sentiment trend arrows
4. R2 archival of raw article HTML
5. Email digest via Resend integration
6. DO fan-out for parallel ticker processing

## Key Constraints
- The user has ~4.5 hours of total development time (three 90-minute blocks).
- Prefer a working product over a polished one. Plain HTML that functions > half-baked features.
- The user has minimal React experience. Keep components simple: useState, useQuery, useMutations, useAuth.
- Do not build custom WebSocket logic; useQuery handles reactive sync automatically.
- Do not introduce external services (no Flink, BigQuery, Kafka). Everything runs on DeepSpace.
