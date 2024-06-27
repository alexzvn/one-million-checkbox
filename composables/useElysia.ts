import { treaty } from '@elysiajs/eden'
import type { App } from '~/elysia'

export const useElysia = () => {
  const client = treaty<App>('http://localhost:3000')

  return client
}