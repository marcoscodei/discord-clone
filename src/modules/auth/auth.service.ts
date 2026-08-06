import { prisma } from '../../lib/prisma'
import { hash, compare } from 'bcrypt'
import { AppError } from '../../shared/errors/app-error'

export class AuthService {
  async register(data: any) {
    const { username, email, password } = data

    const userExists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    })

    if (userExists) {
      throw new AppError('E-mail ou nome de usuário já em uso.')
    }

    const hashedPassword = await hash(password, 10)

    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword }
    })

    return { id: user.id, username: user.username, email: user.email }
  }

  async authenticate(data: any, jwt: any) {
    const { email, password } = data

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !(await compare(password, user.password))) {
      throw new AppError('Credenciais inválidas.', 401)
    }

    const token = jwt.sign({ id: user.id }, { expiresIn: '7d' })

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    }
  }
}