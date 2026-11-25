import type { CollectionSchema } from 'deepspace/schema'

export const summariesSchema: CollectionSchema = {
  name: 'summaries',
  columns: [
    { name: 'ticker', storage: 'text', interpretation: 'plain' },
    { name: 'companyName', storage: 'text', interpretation: 'plain' },
    { name: 'summary', storage: 'text', interpretation: 'plain' },
    { name: 'sentiment', storage: 'text', interpretation: 'plain' },
    { name: 'trend', storage: 'text', interpretation: 'plain' },
    { name: 'keyTopics', storage: 'text', interpretation: 'plain' },
    { name: 'sourceUrls', storage: 'text', interpretation: 'plain' },
    { name: 'sourceCount', storage: 'number', interpretation: 'plain' },
    { name: 'generatedAt', storage: 'number', interpretation: 'plain' },
  ],
  permissions: {
    viewer: { read: true, create: false, update: false, delete: false },
    member: { read: true, create: false, update: false, delete: false },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
