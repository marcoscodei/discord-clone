import { FastifyInstance } from 'fastify'
import { ChannelController } from './channel.controller'
import { ensureAuthenticated } from '../../shared/middlewares/auth.middleware'

const channelController = new ChannelController()

export async function channelRoutes(app: FastifyInstance) {
  app.addHook('preHandler', ensureAuthenticated)

  app.post('/servers/:serverId/channels', channelController.create)
}