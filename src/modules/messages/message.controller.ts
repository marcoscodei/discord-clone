import { FastifyRequest, FastifyReply } from 'fastify'
import { MessageRepository } from './message.repository'

const messageRepository = new MessageRepository()

export class MessageController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { channelId } = request.params as { channelId: string }

    const messages = await messageRepository.findByChannel(channelId)

    return reply.send(messages)
  }
}