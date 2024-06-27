import { defineWorkerQueue } from '@amber.js/core'
import { ok as assert } from 'assert'
import Elysia, { t } from 'elysia'
import mitt from 'mitt'

type UpdateData = {
  offset: number
  data: number
}

type CanvasEvent = {
  update: { offset: number, chunk: number }
}

export const locationOf = (location: number) => [(location / 8) | 0, 2 ** (location % 8)]

export const createCanvas = () => {
  const buffer = new Uint8Array(1_000_000/8)
  const emitter = mitt<CanvasEvent>()

  const check = [
    0b0000_0001,
    0b0000_0010,
    0b0000_0100,
    0b0000_1000,
    0b0001_0000,
    0b0010_0000,
    0b0100_0000,
    0b1000_0000,
  ]

  const isValid = (offset: number, data: number) => {
    return buffer.length > offset 
      && (offset | 0) === offset
      && offset >= 0
      && check.some(value => data === value)
  }

  const queue = defineWorkerQueue<UpdateData>(async ({ offset, data }) => {
    assert(isValid(offset, data))
    buffer[offset] ^= data

    emitter.emit('update', { offset, chunk: buffer[offset] })
  })

  return Object.seal({
    buffer,
    emitter,
    isValid,
    update: (offset: number, chunk: number) => queue.push({ offset, data: chunk })
  })
}

const canvas = createCanvas()


export default new Elysia({ name: 'app:canvas' })
  .decorate('canvas', canvas)
  .model('canvas:update.chunk', t.Object({ offset: t.Number(), chunk: t.Number() }))
  .get('/canvas', ({ set, canvas }) => {
    set.headers['Content-Type'] = 'application/x-binary'
    return Buffer.from(canvas.buffer).toString('base64')
  })
  .ws('/canvas', {
    body: 'canvas:update.chunk',

    open(ws) {
      canvas.emitter.on('update', data => ws.send(data))
    },

    message(ws, { chunk, offset }) {
      if (canvas.isValid(offset, chunk)) {
        canvas.update(offset, chunk)
      }
    },

    close(ws) {

    }
  })