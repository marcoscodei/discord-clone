import { FastifyRequest, FastifyReply } from 'fastify'
import { ChannelService } from './channel.service'
import { z } from 'zod'

const channelService = new ChannelService()

export class ChannelController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const paramsSchema = z.object({ serverId: z.string().uuid() })
    const bodySchema = z.object({
      name: z.string().min(2),
      type: z.enum(['TEXT', 'VOICE']).optional(),
    })

    const { serverId } = paramsSchema.parse(request.params)
    const data = bodySchema.parse(request.body)
    const userId = request.user.id

    const channel = await channelService.createChannel(userId, serverId, data)

    return reply.status(201).send(channel)
  }
}