import cors from '@fastify/cors'
import Fastify from 'fastify'
import { healthRoutes } from './routes/health.js'
import { itemRoutes } from './routes/items.js'

const isDev = process.env.NODE_ENV !== 'production'

const server = Fastify({
  logger: isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }
    : true,
})

async function main() {
  await server.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
  await server.register(healthRoutes)
  await server.register(itemRoutes, { prefix: '/api/items' })

  try {
    await server.listen({ port: 3001, host: '0.0.0.0' })
    console.log('🚀 Server listening on http://localhost:3001')
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

main()
