import { prisma } from '../../lib/prisma'
import { AppError } from '../../shared/errors/app-error'

export class ChannelService {
  async createChannel(userId: string, serverId: string, data: { name: string; type?: 'TEXT' | 'VOICE' }) {
    const member = await prisma.serverMember.findUnique({
      where: { userId_serverId: { userId, serverId } }
    })

    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new AppError('Você não tem permissão para criar canais neste servidor.', 403)
    }

    const channel = await prisma.channel.create({
      data: {
        name: data.name,
        type: data.type || 'TEXT',
        serverId
      }
    })

    return channel
  }
}