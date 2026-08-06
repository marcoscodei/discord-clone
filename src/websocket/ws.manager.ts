import { WebSocket } from 'ws'

export class WebSocketManager {
  private rooms = new Map<string, Set<WebSocket>>()

  public joinChannel(channelId: string, socket: WebSocket) {
    if (!this.rooms.has(channelId)) {
      this.rooms.set(channelId, new Set())
    }
    this.rooms.get(channelId)!.add(socket)
  }

  public leaveChannel(channelId: string, socket: WebSocket) {
    const channelSockets = this.rooms.get(channelId)
    if (channelSockets) {
      channelSockets.delete(socket)
      if (channelSockets.size === 0) {
        this.rooms.delete(channelId)
      }
    }
  }

  public broadcastToChannel(channelId: string, payload: any) {
    const channelSockets = this.rooms.get(channelId)
    if (channelSockets) {
      const messageString = JSON.stringify(payload)
      for (const client of channelSockets) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageString)
        }
      }
    }
  }
}

export const wsManager = new WebSocketManager()