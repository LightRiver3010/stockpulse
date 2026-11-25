/**
 * Landing page — a STATIC page.
 *
 * Lives at the top level of src/pages/ (not under (app)/), so it renders with
 * no DeepSpace providers: no auth session fetch, no records WebSocket.
 * Prerendered to static HTML at build time — keep renderable without
 * window/document during initial render.
 */

import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { Seo } from '../components/Seo'
import { APP_NAME } from '../constants'
import { useFadeInOnScroll } from '../lib/useFadeInOnScroll'
import { seo } from '../seo'

const SAMPLE_CARD = {
  companyName: 'NVIDIA Corporation',
  ticker: 'NVDA',
  sentimentLabel: 'Leaning Positive',
  sentimentClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  trendSymbol: '↑',
  trendLabel: 'Improving',
  trendClass: 'text-emerald-600',
  updatedLabel: 'Today · 5:30 PM ET',
  summary:
    'Analysts raised near-term data center demand estimates following strong cloud capex commentary from hyperscalers. Supply chain checks indicate steady Blackwell ramp-up, though investors remain watchful of export policy headlines.',
  topics: ['AI Infrastructure', 'Data Center Demand', 'Blackwell Ramp', 'Cloud Capex'],
  sources: [
    'https://www.reuters.com/technology/nvidia-data-center-demand-outlook',
    'https://www.bloomberg.com/news/articles/hyperscaler-ai-spending-update',
    'https://www.cnbc.com/semiconductor-supply-chain-checks',
  ],
}

const STEPS = [
  {
    number: '01',
    title: 'Pick your watchlist',
    description:
      'Search any S&P 500 ticker and follow up to 10 companies you care about—no clutter, no noisy feeds.',
  },
  {
    number: '02',
    title: 'AI-distilled briefings',
    description:
      'The Exa API gathers recent news stories, and Claude extracts sentiment, concise summaries, and key points. Source links update weekdays at 5:30 PM ET.',
  },
  {
    number: '03',
    title: 'Track sentiment shifts',
    description:
      'Spot Improving vs. Worsening trends across your last 5 summaries at a glance without reading dozens of articles.',
  },
]

function PreviewSummaryCard() {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showSources, setShowSources] = useState(false)

  return (
    <div className="card-elevated rounded-xl border border-border bg-card shadow-[0_8px_32px_rgba(0,0,0,0.32)] overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        className="w-full p-5 text-left cursor-pointer space-y-3 transition-colors hover:bg-accent/40"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold tracking-tight text-foreground truncate">
              {SAMPLE_CARD.companyName}
            </h3>
            <span className="font-mono text-xs font-medium text-muted-foreground">
              {SAMPLE_CARD.ticker}
            </span>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span
              className={`text-xs font-medium inline-flex items-center gap-1 ${SAMPLE_CARD.trendClass}`}
            >
              <span>{SAMPLE_CARD.trendSymbol}</span>
              <span>{SAMPLE_CARD.trendLabel}</span>
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
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${SAMPLE_CARD.sentimentClass}`}
          >
            {SAMPLE_CARD.sentimentLabel}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {SAMPLE_CARD.updatedLabel}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 pt-3 space-y-3.5 border-t border-border">
          <p className="text-sm leading-relaxed text-foreground">{SAMPLE_CARD.summary}</p>

          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_CARD.topics.map((topic) => (
              <span
                key={topic}
                className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground"
              >
                {topic}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-2.5 border-t border-border">
            <span className="font-mono">{SAMPLE_CARD.sources.length} sources</span>
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
          </div>

          {showSources && (
            <ul className="space-y-1.5 pt-2 border-t border-border text-xs">
              {SAMPLE_CARD.sources.map((url) => (
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
      )}
    </div>
  )
}

function FadeInSection({
  id,
  className = '',
  children,
}: {
  id?: string
  className?: string
  children: ReactNode
}) {
  const { ref, isVisible } = useFadeInOnScroll<HTMLElement>()
  return (
    <section
      id={id}
      ref={ref}
      className={`fade-in-section ${isVisible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </section>
  )
}

export default function Landing() {
  return (
    <>
      <Seo {...seo} path="/" />
      <div data-testid="static-landing" className="min-h-screen bg-background text-foreground">
        {/* Sticky translucent header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="font-display text-base font-bold tracking-tight text-foreground"
              >
                {APP_NAME}
              </Link>
              <nav className="hidden sm:flex items-center gap-5 text-xs font-medium text-muted-foreground">
                <a href="#how-it-works" className="transition-colors hover:text-foreground">
                  How it works
                </a>
                <a href="#why-i-created-this" className="transition-colors hover:text-foreground">
                  Why I created this
                </a>
              </nav>
            </div>
            <Link
              to="/home"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#39d9b9] to-[#20b899] px-4 py-1.5 font-display text-xs font-semibold text-[#0d1117] shadow-[0_0_16px_rgba(57,217,185,0.2)] transition-all hover:brightness-105"
            >
              Open Dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <p className="font-mono text-xs sm:text-sm font-bold uppercase tracking-[0.14em] text-primary">
                Daily Market Briefings · Updated Weekdays 5:30 PM ET
              </p>
              <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.06]">
                Investing shouldn&apos;t require reading 10 articles a day.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-foreground/85 sm:text-lg">
                StockPulse tracks your watchlist and turns each day&apos;s market coverage into
                quick, readable summaries—complete with sentiment, key topics, and 5-day trends.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/home"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#39d9b9] to-[#20b899] px-6 py-3 font-display text-sm font-semibold text-[#0d1117] shadow-[0_0_20px_rgba(57,217,185,0.22)] transition-all hover:brightness-105"
                >
                  Open Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="font-mono text-xs sm:text-sm font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                >
                  See how it works →
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Sample Briefing
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-primary">
                  Interactive Preview
                </span>
              </div>
              <PreviewSummaryCard />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <FadeInSection id="how-it-works" className="border-t border-border bg-card/30 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-6 space-y-12">
            <div className="max-w-2xl space-y-3">
              <p className="font-mono text-base sm:text-lg font-bold uppercase tracking-[0.14em] text-primary">
                How It Works
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Built for people who want the signal, not the noise.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {STEPS.map((step) => (
                <div
                  key={step.number}
                  className="card-elevated rounded-xl border border-border bg-card p-6 space-y-3"
                >
                  <span className="inline-block font-mono text-base sm:text-lg font-bold text-primary">
                    {step.number}
                  </span>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base leading-relaxed text-foreground/85">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </FadeInSection>

        {/* Why I Created This */}
        <FadeInSection id="why-i-created-this" className="border-t border-border py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="card-elevated rounded-xl border border-border bg-card p-8 sm:p-10 space-y-5">
              <p className="font-mono text-base sm:text-lg font-bold uppercase tracking-[0.14em] text-primary">
                Why I Created This
              </p>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Staying informed shouldn&apos;t take over your day.
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-foreground/90">
                <p>
                  As a busy student, I don&apos;t have time to read and analyze news articles every
                  day without sacrificing something like my grades or career growth. I wished there
                  was a way I could just get the gist of what&apos;s happening without getting
                  sucked into 10+ articles and hours of reading conflicting opinions and clickbait.
                </p>
                <p>
                  So, I created StockPulse to do just that. The summaries might not meet the
                  standards of a Wall Street day trader, but they&apos;re good enough for the
                  average person—like me. I hope you can find as much use for it as I do.
                </p>
              </div>
            </div>
          </div>
        </FadeInSection>

        {/* Closing CTA */}
        <FadeInSection className="border-t border-border bg-card/30 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-6 text-center space-y-6">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Stay informed in minutes, not hours.
            </h2>
            <p className="text-base leading-relaxed text-foreground/85 max-w-xl mx-auto">
              Pick the companies you follow and let StockPulse handle the daily reading.
            </p>
            <div>
              <Link
                to="/home"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#39d9b9] to-[#20b899] px-6 py-3 font-display text-sm font-semibold text-[#0d1117] shadow-[0_0_20px_rgba(57,217,185,0.22)] transition-all hover:brightness-105"
              >
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </FadeInSection>

        {/* Footer */}
        <footer className="border-t border-border py-8">
          <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 px-6 text-xs text-muted-foreground">
            <span className="font-display font-semibold text-foreground">{APP_NAME}</span>
            <span className="font-mono">Updates weekdays at 5:30 PM ET</span>
            <Link to="/home" className="hover:text-foreground transition-colors">
              Dashboard →
            </Link>
          </div>
        </footer>
      </div>
    </>
  )
}
