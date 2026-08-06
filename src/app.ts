import fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifyWebsocket from '@fastify/websocket'
import { env } from './config/env'
import { AppError } from './shared/errors/app-error'
import { authRoutes } from './modules/auth/auth.routes'
import { serverRoutes } from './modules/servers/server.routes'
import { channelRoutes } from './modules/channels/channel.routes'
import { messageRoutes } from './modules/messages/message.routes'
import { wsGateway } from './websocket/ws.gateway'

export const app = fastify({ logger: true })

app.register(cors, { origin: '*' })
app.register(fastifyJwt, { secret: env.JWT_SECRET })
app.register(fastifyWebsocket)

app.register(authRoutes)
app.register(serverRoutes)
app.register(channelRoutes)
app.register(messageRoutes)
app.register(wsGateway)

app.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      status: 'error',
      message: error.message,
    })
  }

  if (error.validation) {
    return reply.status(400).send({
      status: 'error',
      message: 'Erro de validação nos dados enviados.',
      issues: error.validation,
    })
  }

  console.error('Erro interno do servidor:', error)

  return reply.status(500).send({
    status: 'error',
    message: 'Erro interno de servidor.',
  })
})