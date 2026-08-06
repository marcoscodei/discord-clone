import { prisma } from '../../lib/prisma'

export class MessageRepository {
  async create(data: { content: string; userId: string; channelId: string }) {
    return prisma.message.create({
      data,
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true }
        }
      }
    })
  }

  async findByChannel(channelId: string) {
    return prisma.message.findMany({
      where: { channelId },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
  }

  async update(id: string, content: string) {
    return prisma.message.update({
      where: { id },
      data: { 
        content, 
        edited: true 
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true }
        }
      }
    })
  }

  async delete(id: string) {
    return prisma.message.delete({
      where: { id }
    })
  }
}