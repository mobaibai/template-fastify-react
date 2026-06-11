import { ItemSchema, ItemUpdateSchema } from '@repo/schema'
import type { Item } from '@repo/types'
import type { FastifyPluginAsync } from 'fastify'

const items: Item[] = []
let nextId = 1

export const itemRoutes: FastifyPluginAsync = async (server) => {
  server.post('/', async (request, reply) => {
    const data = ItemSchema.parse(request.body)
    const item: Item = {
      id: String(nextId++),
      name: data.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    items.push(item)
    reply.code(201)
    return { code: 0, data: item, message: 'created' }
  })

  server.get('/', async () => {
    return { code: 0, data: { list: items, total: items.length }, message: 'ok' }
  })

  server.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const item = items.find((i) => i.id === request.params.id)
    if (!item) {
      reply.code(404)
      return { code: 404, data: null, message: 'not found' }
    }
    return { code: 0, data: item, message: 'ok' }
  })

  server.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const data = ItemUpdateSchema.parse(request.body)
    const index = items.findIndex((i) => i.id === request.params.id)
    if (index === -1) {
      reply.code(404)
      return { code: 404, data: null, message: 'not found' }
    }
    items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() }
    return { code: 0, data: items[index], message: 'updated' }
  })

  server.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const index = items.findIndex((i) => i.id === request.params.id)
    if (index === -1) {
      reply.code(404)
      return { code: 404, data: null, message: 'not found' }
    }
    items.splice(index, 1)
    return { code: 0, data: null, message: 'deleted' }
  })
}
