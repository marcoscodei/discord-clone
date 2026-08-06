import { FastifyInstance } from 'fastify'
import { MessageController } from './message.controller'
import { ensureAuthenticated } from '../../shared/middlewares/auth.middleware'

const messageController = new MessageController()

export async function messageRoutes(app: FastifyInstance) {
  app.addHook('preHandler', ensureAuthenticated)

  app.get('/channels/:channelId/messages', messageController.list)
}