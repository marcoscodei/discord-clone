import { FastifyRequest, FastifyReply } from 'fastify'
import { ServerService } from './server.service'
import { z } from 'zod'

const serverService = new ServerService()

export class ServerController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const createSchema = z.object({
      name: z.string().min(2),
      imageUrl: z.string().url().optional(),
    })

    const data = createSchema.parse(request.body)
    const userId = request.user.id

    const server = await serverService.createServer(userId, data)

    return reply.status(201).send(server)
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id
    const servers = await serverService.listUserServers(userId)

    return reply.send(servers)
  }
}