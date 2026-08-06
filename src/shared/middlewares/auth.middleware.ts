import { FastifyRequest, FastifyReply } from 'fastify'
import { AppError } from '../errors/app-error'

export async function ensureAuthenticated(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    throw new AppError('Token inválido ou expirado.', 401)
  }
}