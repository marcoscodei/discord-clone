import { FastifyInstance } from 'fastify'
import { AuthController } from './auth.controller'

const authController = new AuthController()

export async function authRoutes(app: FastifyInstance) {
  app.post('/users', authController.register)
  app.post('/sessions', authController.login)
}