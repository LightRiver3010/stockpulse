import type { CollectionSchema } from 'deepspace/schema'

export const watchlistSchema: CollectionSchema = {
  name: 'watchlist',
  columns: [
    { name: 'userId', storage: 'text', interpretation: 'plain', userBound: true, immutable: true },
    { name: 'ticker', storage: 'text', interpretation: 'plain' },
    { name: 'addedAt', storage: 'number', interpretation: 'plain' },
  ],
  ownerField: 'userId',
  permissions: {
    viewer: { read: 'own', create: true, update: 'own', delete: 'own' },
    member: { read: 'own', create: true, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
