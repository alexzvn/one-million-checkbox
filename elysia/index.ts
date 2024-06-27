import Elysia from 'elysia'
import { cors } from '@elysiajs/cors'
import canvas from './src/canvas'

const app = new Elysia()
  .use(canvas)
  .use(cors({ origin: '*' }))
  .get('/', () => 'hi')
  .listen(3000, () => console.log('Elysia started'))

export type App = typeof app