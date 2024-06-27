<template>
  <div ref="container" class="container my-5 mx-auto">
    <div v-bind="containerProps" style="height: 90vh;">
      <div v-bind="wrapperProps">
        <div v-for="i in list" class="flex justify-center">
          <input v-for="j in i.data" type="checkbox" :id="'i-' + j" :checked="isChecked(j)" @click="check(j)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import chunk from 'lodash/chunk'
import { useVirtualList } from '@vueuse/core'

const elysia = useElysia()

const { data } = await elysia.canvas.get()

function base64ToArrayBuffer(base64: string) {
  let binaryString = atob(base64);
  let bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

const buffer =  base64ToArrayBuffer(data!) //new TextEncoder().encode(data!)

console.log(buffer);

const chunker = ref(chunk([...new Array(buffer.length * 8).keys()], 50))

const { wrapperProps, containerProps, list } = useVirtualList(chunker, { itemHeight: 14 })

const locationOf = (location: number) => [(location / 8) | 0, 2 ** (location % 8)]

const isChecked = (location: number) => {
  const [offset, loc] = locationOf(location)

  return (buffer[offset] & loc) > 0
}

const socket = elysia.canvas.subscribe()

const check = (location: number) => {
  const [offset, loc] = locationOf(location)

  socket.send({ offset, chunk: loc })
}

onMounted(() => {
  const $ = document.querySelector.bind(document)

  socket.on('message', (data) => {
    const { offset, chunk } = data.data as { offset: number, chunk: number }
    buffer[offset] = chunk

    const begin = offset * 8;

    [1, 2, 4, 8, 16, 32, 64, 128].forEach((flag, i) => {
      console.log(begin);
      

      const input = $<HTMLInputElement>(`#i-${begin + i}`) 

      if (input) {
        input.checked = isChecked(begin + i)
      }
    });
  })
})
</script>

