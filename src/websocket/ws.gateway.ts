import { FastifyInstance } from 'fastify'
import { wsManager } from './ws.manager'
import { MessageRepository } from '../modules/messages/message.repository'

const messageRepository = new MessageRepository()

export async function wsGateway(app: FastifyInstance) {
  app.get('/ws/:channelId', { websocket: true }, (socket, req) => {
    const { channelId } = req.params as { channelId: string }

    wsManager.joinChannel(channelId, socket)

    socket.on('message', async (rawMessage: Buffer) => {
      try {
        const data = JSON.parse(rawMessage.toString())

        // 1. Evento de "Digitando..."
        if (data.event === 'TYPING') {
          wsManager.broadcastToChannel(channelId, {
            event: 'TYPING',
            username: data.username,
          })
          return
        }

        // 2. Evento de Editar Mensagem
        if (data.event === 'EDIT_MESSAGE') {
          const updatedMessage = await messageRepository.update(data.messageId, data.content)
          wsManager.broadcastToChannel(channelId, {
            event: 'MESSAGE_UPDATED',
            data: updatedMessage,
          })
          return
        }

        // 3. Evento de Excluir Mensagem
        if (data.event === 'DELETE_MESSAGE') {
          await messageRepository.delete(data.messageId)
          wsManager.broadcastToChannel(channelId, {
            event: 'MESSAGE_DELETED',
            messageId: data.messageId,
          })
          return
        }

        // 4. Fluxo normal de criar mensagem de chat
        const savedMessage = await messageRepository.create({
          content: data.content,
          userId: data.userId,
          channelId,
        })

        wsManager.broadcastToChannel(channelId, {
          event: 'NEW_MESSAGE',
          data: savedMessage,
        })
      } catch (err) {
        console.error('Erro no fluxo WebSocket:', err)
      }
    })

    socket.on('close', () => {
      wsManager.leaveChannel(channelId, socket)
    })
  })
}