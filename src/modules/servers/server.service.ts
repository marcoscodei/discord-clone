import { prisma } from '../../lib/prisma'

export class ServerService {
  async createServer(userId: string, data: { name: string; imageUrl?: string }) {
    const { name, imageUrl } = data

    const server = await prisma.server.create({
      data: {
        name,
        imageUrl,
        members: {
          create: {
            userId,
            role: 'OWNER'
          }
        },
        channels: {
          create: {
            name: 'geral',
            type: 'TEXT'
          }
        }
      },
      include: {
        channels: true,
        members: true
      }
    })

    return server
  }

  async listUserServers(userId: string) {
    return prisma.server.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        channels: true
      }
    })
  }
}