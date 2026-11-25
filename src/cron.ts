/**
 * Cron task definitions — registered into the AppCronRoom DO at construction
 * time (worker.ts). The DO alarm fires `runTask(name, env)` on the schedule
 * declared here; the DO itself records executions, tracks history, and
 * pushes status to admin clients via the `/ws/cron/:roomId` WebSocket.
 */

import type { CronTask } from 'deepspace/worker'
import { runPipeline } from './server/pipeline.js'
import type { Env } from '../worker.js'

export const tasks: CronTask[] = [
  { name: 'summarize-stocks', schedule: '30 17 * * 1-5', timezone: 'America/New_York' },
]

export async function runTask(name: string, env: Env): Promise<void> {
  if (name === 'summarize-stocks') {
    await runPipeline(env)
  }
}
