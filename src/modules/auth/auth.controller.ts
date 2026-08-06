import { FastifyRequest, FastifyReply } from 'fastify'
import { AuthService } from './auth.service'
import { z } from 'zod'

const authService = new AuthService()

export class AuthController {
  async register(request: FastifyRequest, reply: FastifyReply) {
    const registerSchema = z.object({
      username: z.string().min(3),
      email: z.string().email(),
      password: z.string().min(6),
    })

    const body = registerSchema.parse(request.body)
    const user = await authService.register(body)

    return reply.status(201).send(user)
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string(),
    })

    const body = loginSchema.parse(request.body)
    const session = await authService.authenticate(body, serverJwt(reply))

    return reply.send(session)
  }
}

function serverJwt(reply: FastifyReply) {
  return reply.server.jwt
}