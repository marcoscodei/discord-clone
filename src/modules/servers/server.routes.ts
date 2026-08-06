import { FastifyInstance } from 'fastify'
import { ServerController } from './server.controller'
import { ensureAuthenticated } from '../../shared/middlewares/auth.middleware'

const serverController = new ServerController()

export async function serverRoutes(app: FastifyInstance) {
  app.addHook('preHandler', ensureAuthenticated)

  app.post('/servers', serverController.create)
  app.get('/servers', serverController.list)
}