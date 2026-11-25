import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockQuery = vi.fn()
const mockCreate = vi.fn()
const mockGenerateText = vi.fn()
const mockExaSearch = vi.fn()

vi.mock('deepspace/worker', () => ({
  buildCronContext: () => ({
    records: {
      query: mockQuery,
      create: mockCreate,
    },
  }),
  createDeepSpaceAI: () => () => 'mock-claude-model',
  apiWorkerFetch: vi.fn(),
}))

vi.mock('ai', () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
}))

vi.mock('exa-js', () => ({
  default: class MockExa {
    search = mockExaSearch
  },
}))

import { validateSummaryOutput, runPipeline } from './pipeline'
import type { Env } from '../../worker'

const mockEnv = {
  EXA_API_KEY: 'test-exa-key',
  OWNER_USER_ID: 'owner-1',
  DEEPSPACE_APP_ID: 'app-1',
  APP_OWNER_JWT: 'jwt-1',
} as unknown as Env

describe('validateSummaryOutput', () => {
  it('accepts valid structured output', () => {
    const valid = {
      summary: 'Apple reported steady hardware sales. Services revenue grew.',
      sentiment: 'leaning_positive',
      trend: 'improving',
      keyTopics: ['Hardware sales', 'Services growth'],
      sourceCount: 2,
    }
    expect(validateSummaryOutput(valid)).toEqual(valid)
  })

  it('rejects invalid sentiment, trend, or missing fields', () => {
    expect(() =>
      validateSummaryOutput({
        summary: 'Test',
        sentiment: 'bullish',
        trend: 'steady',
        keyTopics: ['Topic'],
        sourceCount: 1,
      }),
    ).toThrow(/Invalid sentiment/)

    expect(() =>
      validateSummaryOutput({
        summary: 'Test',
        sentiment: 'positive',
        trend: 'skyrocketing',
        keyTopics: ['Topic'],
        sourceCount: 1,
      }),
    ).toThrow(/Invalid trend/)

    expect(() =>
      validateSummaryOutput({
        summary: '',
        sentiment: 'neutral',
        trend: 'steady',
        keyTopics: ['Topic'],
        sourceCount: 1,
      }),
    ).toThrow(/Missing or empty "summary"/)

    expect(() =>
      validateSummaryOutput({
        summary: 'Test',
        sentiment: 'neutral',
        trend: 'steady',
        keyTopics: [],
        sourceCount: 1,
      }),
    ).toThrow(/keyTopics/)
  })
})

describe('runPipeline edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockResolvedValue({ recordId: 'rec_123' })
  })

  it('handles 0 Exa results without calling the LLM and stores a neutral placeholder', async () => {
    mockQuery.mockResolvedValue([])
    mockExaSearch.mockResolvedValue({ results: [] })

    const res = await runPipeline(mockEnv, { specificTickers: ['AAPL'] })

    expect(res.considered).toBe(1)
    expect(res.processed).toBe(1)
    expect(res.failed).toBe(0)
    expect(res.exaCalls).toBe(1)
    expect(res.llmCalls).toBe(0)
    expect(mockGenerateText).not.toHaveBeenCalled()
    expect(mockCreate).toHaveBeenCalledWith(
      'summaries',
      expect.objectContaining({
        ticker: 'AAPL',
        sentiment: 'neutral',
        sourceCount: 0,
        summary: 'No recent news found for Apple Inc in the past 48 hours.',
      }),
    )
  })

  it('isolates malformed LLM JSON per ticker and continues processing remaining tickers', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockQuery.mockResolvedValue([])
    mockExaSearch.mockResolvedValue({
      results: [{ title: 'News', url: 'https://example.com', highlights: ['Some news text'] }],
    })

    mockGenerateText
      .mockResolvedValueOnce({ text: 'NOT VALID JSON {' })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          summary: 'Nvidia demand remains strong.',
          sentiment: 'leaning_positive',
          trend: 'improving',
          keyTopics: ['AI demand'],
          sourceCount: 1,
        }),
      })

    const res = await runPipeline(mockEnv, { specificTickers: ['TSLA', 'NVDA'] })

    expect(res.considered).toBe(2)
    expect(res.failed).toBe(1)
    expect(res.processed).toBe(1)
    expect(res.results[0]).toMatchObject({ ticker: 'TSLA', status: 'failed' })
    expect(res.results[1]).toMatchObject({ ticker: 'NVDA', status: 'success' })
    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(mockCreate).toHaveBeenCalledWith(
      'summaries',
      expect.objectContaining({ ticker: 'NVDA' }),
    )

    errorSpy.mockRestore()
  })

  it('skips tickers with fresh summaries (<4h) unless forceRefresh is true', async () => {
    mockQuery
      .mockResolvedValueOnce([{ recordId: 'w1', data: { userId: 'u1', ticker: 'AAPL', addedAt: 1 } }])
      .mockResolvedValueOnce([{ recordId: 's1', data: { ticker: 'AAPL', generatedAt: Date.now() - 60_000 } }])

    const res = await runPipeline(mockEnv)

    expect(res.considered).toBe(1)
    expect(res.skipped).toBe(1)
    expect(res.processed).toBe(0)
    expect(res.exaCalls).toBe(0)
    expect(res.llmCalls).toBe(0)
    expect(mockExaSearch).not.toHaveBeenCalled()
  })
})
