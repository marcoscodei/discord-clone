'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../services/api'
import {
  Hash,
  Plus,
  Send,
  ChevronDown,
  Mic,
  Headphones,
  Settings,
  Bell,
  Pin,
  Users,
  Search,
  Inbox,
  PlusCircle,
  Gift,
  Smile,
  LogOut,
} from 'lucide-react'

interface Server {
  id: string
  name: string
  channels: { id: string; name: string }[]
}

interface Message {
  id: string
  content: string
  user: { username: string }
}

export default function ChatPage() {
  const router = useRouter()
  const [servers, setServers] = useState<Server[]>([])
  const [currentServer, setCurrentServer] = useState<Server | null>(null)
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [newServerName, setNewServerName] = useState('')
  const [showNewServerInput, setShowNewServerInput] = useState(false)
  const [channelsOpen, setChannelsOpen] = useState(true)
  const [showMembers, setShowMembers] = useState(true)
  
  // Novos estados para Tempo Real
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Inicializa estado do usuário
  const [userId, setUserId] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue
        const val = localStorage.getItem(key)
        if (!val) continue
        if (val.startsWith('{') || val.startsWith('[')) {
          const parsed = JSON.parse(val)
          if (parsed.id) return parsed.id
        }
      }
    } catch (e) {}
    return ''
  })

  const [username, setUsername] = useState<string>(() => {
    if (typeof window === 'undefined') return 'Usuário'
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue
        const val = localStorage.getItem(key)
        if (!val) continue
        if (val.startsWith('{') || val.startsWith('[')) {
          const parsed = JSON.parse(val)
          const name = parsed.username || parsed.name || parsed.displayName
          if (name) return name
        }
      }
    } catch (e) {}
    return 'Usuário'
  })

  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const currentChannel = useMemo(
    () => currentServer?.channels.find((c) => c.id === currentChannelId) ?? null,
    [currentServer, currentChannelId]
  )

  // Função para tocar o som de notificação nativo (Estilo Discord - "Pop")
  function playNotificationSound() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()

      osc.type = 'sine'
      // Frequência subindo para imitar o som de pop/notificação
      osc.frequency.setValueAtTime(400, audioCtx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.08)

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08)

      osc.connect(gain)
      gain.connect(audioCtx.destination)

      osc.start()
      osc.stop(audioCtx.currentTime + 0.08)
    } catch (e) {
      console.error('Erro ao tocar som de notificação', e)
    }
  }

  useEffect(() => {
    api.get('/users/me').then((res) => {
      if (res.data?.username) setUsername(res.data.username)
      if (res.data?.id) setUserId(res.data.id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    api.get('/servers').then((res) => {
      setServers(res.data)
      if (res.data.length > 0) {
        setCurrentServer(res.data[0])
        if (res.data[0].channels.length > 0) {
          setCurrentChannelId(res.data[0].channels[0].id)
        }
      }
    })
  }, [])

  // Gerenciamento do WebSocket e Eventos em Tempo Real
  useEffect(() => {
    if (!currentChannelId) return

    api.get(`/channels/${currentChannelId}/messages`).then((res) => {
      setMessages(res.data)
    }).catch((err) => {
      console.error('Erro ao buscar histórico de mensagens', err)
    })

    if (wsRef.current) {
      wsRef.current.close()
    }

    const ws = new WebSocket(`ws://localhost:3334/ws/${currentChannelId}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.event === 'NEW_MESSAGE') {
        setMessages((prev) => [...prev, data.data])
        // Toca o som se a mensagem não for do próprio usuário logado
        if (data.data.user?.username !== username) {
          playNotificationSound()
        }
      } else if (data.event === 'TYPING') {
        // Evento de outro usuário digitando
        if (data.username !== username) {
          setTypingUsers((prev) => {
            if (prev.includes(data.username)) return prev
            return [...prev, data.username]
          })

          // Remove o "digitando..." após 3 segundos sem novas digitações
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u !== data.username))
          }, 3000)
        }
      } else if (data.id && data.content) {
        setMessages((prev) => [...prev, data])
      }
    }

    return () => {
      ws.close()
    }
  }, [currentChannelId, username])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Dispara evento de "Digitando..." via WebSocket enquanto o usuário digita
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setInputMessage(value)

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Evita disparar flood de eventos a cada tecla exata
      if (!typingTimeoutRef.current) {
        wsRef.current.send(
          JSON.stringify({
            event: 'TYPING',
            username,
          })
        )
        typingTimeoutRef.current = setTimeout(() => {
          typingTimeoutRef.current = null
        }, 2000)
      }
    }
  }

  async function handleCreateServer(e: React.FormEvent) {
    e.preventDefault()
    if (!newServerName) return
    try {
      const res = await api.post('/servers', { name: newServerName })
      setServers((prev) => [...prev, res.data])
      setNewServerName('')
      setShowNewServerInput(false)
    } catch (err) {
      console.error('Erro ao criar servidor', err)
    }
  }

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!inputMessage.trim() || !wsRef.current) return

    wsRef.current.send(
      JSON.stringify({
        userId,
        content: inputMessage,
      })
    )
    setInputMessage('')
  }

  function handleLogout() {
    localStorage.clear()
    if (wsRef.current) {
      wsRef.current.close()
    }
    router.push('/')
  }

  function getInitials(name: string) {
    return name ? name.substring(0, 2).toUpperCase() : 'US'
  }

  function avatarColor(name: string) {
    const colors = ['#5865f2', '#eb459e', '#23a55a', '#f0b232', '#f23f42', '#3ba55d']
    const idx = (name || 'U').charCodeAt(0) % colors.length
    return colors[idx]
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#313338] text-white">
      {/* 1. Barra de servidores */}
      <div className="flex w-[72px] flex-col items-center gap-2 bg-[#1e1f22] py-3">
        <button
          onClick={() => setCurrentServer(null)}
          className={`group relative flex h-12 w-12 items-center justify-center rounded-3xl bg-[#5865f2] transition-all hover:rounded-2xl ${
            !currentServer ? '!rounded-2xl' : ''
          }`}
        >
          <span
            className={`absolute -left-3 h-2 w-1 rounded-full bg-white transition-all ${
              !currentServer ? 'h-5' : 'h-0 group-hover:h-2'
            }`}
          />
          <Inbox size={22} />
        </button>

        <div className="my-1 h-[2px] w-8 rounded bg-[#35373c]" />

        {servers.map((server) => (
          <button
            key={server.id}
            onClick={() => {
              setCurrentServer(server)
              if (server.channels.length > 0) setCurrentChannelId(server.channels[0].id)
              setMessages([])
            }}
            className={`group relative flex h-12 w-12 items-center justify-center rounded-3xl bg-[#313338] text-[15px] font-semibold transition-all hover:rounded-2xl hover:bg-[#5865f2] ${
              currentServer?.id === server.id ? '!rounded-2xl !bg-[#5865f2]' : ''
            }`}
          >
            <span
              className={`absolute -left-3 rounded-full bg-white transition-all ${
                currentServer?.id === server.id
                  ? 'h-10 w-1'
                  : 'h-0 w-1 group-hover:h-5'
              }`}
            />
            {getInitials(server.name)}
          </button>
        ))}

        <button
          onClick={() => setShowNewServerInput((v) => !v)}
          className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#313338] text-[#23a55a] transition-all hover:rounded-2xl hover:bg-[#23a55a] hover:text-white"
        >
          <Plus size={24} />
        </button>

        {showNewServerInput && (
          <form onSubmit={handleCreateServer} className="mt-1 flex flex-col items-center px-2">
            <input
              autoFocus
              type="text"
              placeholder="Nome do servidor"
              value={newServerName}
              onChange={(e) => setNewServerName(e.target.value)}
              className="w-16 rounded bg-[#2b2d31] p-1 text-center text-[10px] text-white outline-none"
            />
          </form>
        )}
      </div>

      {/* 2. Canais */}
      <div className="flex w-60 flex-col bg-[#2b2d31]">
        <button className="flex h-12 items-center justify-between border-b border-[#1f2023] px-4 text-[15px] font-semibold shadow-sm hover:bg-[#35373c]/40">
          {currentServer ? currentServer.name : 'Mensagens Diretas'}
          <ChevronDown size={18} className="text-[#949ba4]" />
        </button>

        <div className="flex-1 overflow-y-auto px-2 pt-3">
          <button
            onClick={() => setChannelsOpen((v) => !v)}
            className="mb-1 flex w-full items-center gap-1 px-1 text-xs font-semibold uppercase text-[#949ba4] hover:text-[#dbdee1]"
          >
            <ChevronDown
              size={12}
              className={`transition-transform ${channelsOpen ? '' : '-rotate-90'}`}
            />
            Canais de Texto
          </button>

          {channelsOpen &&
            currentServer?.channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => {
                  setCurrentChannelId(channel.id)
                  setMessages([])
                }}
                className={`group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-[15px] text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1] ${
                  currentChannelId === channel.id ? 'bg-[#404249] text-white' : ''
                }`}
              >
                <Hash size={20} className="text-[#80848e]" />
                {channel.name}
              </button>
            ))}
        </div>

        {/* Painel do usuário */}
        <div className="flex h-[52px] items-center gap-1.5 bg-[#232428] px-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: avatarColor(username) }}
          >
            {getInitials(username)}
          </div>
          <div className="flex-1 min-w-0 leading-tight">
            <p className="truncate text-[13px] font-semibold text-white">
              {username}
            </p>
            <p className="text-[10px] text-[#949ba4]">Online</p>
          </div>
          <button title="Microfone" className="rounded p-1 text-[#b5bac1] hover:bg-[#3f4147] hover:text-white">
            <Mic size={16} />
          </button>
          <button title="Fones de ouvido" className="rounded p-1 text-[#b5bac1] hover:bg-[#3f4147] hover:text-white">
            <Headphones size={16} />
          </button>
          <button title="Configurações" className="rounded p-1 text-[#b5bac1] hover:bg-[#3f4147] hover:text-white">
            <Settings size={16} />
          </button>
          <button
            onClick={handleLogout}
            title="Sair da conta"
            className="rounded p-1 text-[#f23f42] hover:bg-[#3f4147] hover:text-[#f23f42]"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* 3. Chat */}
      <div className="flex flex-1 flex-col bg-[#313338]">
        <div className="flex h-12 items-center justify-between border-b border-[#1f2023] px-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Hash size={22} className="text-[#80848e]" />
            <span className="font-semibold">{currentChannel?.name || 'geral'}</span>
          </div>
          <div className="flex items-center gap-4 text-[#b5bac1]">
            <Bell size={20} className="cursor-pointer hover:text-white" />
            <Pin size={20} className="cursor-pointer hover:text-white" />
            <Users
              size={20}
              onClick={() => setShowMembers((v) => !v)}
              className={`cursor-pointer hover:text-white ${showMembers ? 'text-white' : ''}`}
            />
            <div className="flex items-center rounded bg-[#1e1f22] px-2">
              <input
                placeholder="Pesquisar"
                className="w-32 bg-transparent py-1 text-xs outline-none placeholder:text-[#949ba4]"
              />
              <Search size={14} className="text-[#949ba4]" />
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col">
            <div className="flex-1 space-y-0.5 overflow-y-auto px-4 py-4">
              {messages.map((msg, index) => {
                const prev = messages[index - 1]
                const grouped = prev && prev.user?.username === msg.user?.username

                return (
                  <div
                    key={msg.id ?? index}
                    className={`group flex items-start gap-3 rounded px-2 py-0.5 hover:bg-[#2e3035] ${
                      grouped ? 'mt-0' : 'mt-3'
                    }`}
                  >
                    {!grouped ? (
                      <div
                        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: avatarColor(msg.user?.username || 'Usuário') }}
                      >
                        {getInitials(msg.user?.username || 'Usuário')}
                      </div>
                    ) : (
                      <div className="w-10 shrink-0 text-center text-[10px] text-[#949ba4] opacity-0 group-hover:opacity-100">
                        {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      {!grouped && (
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-white">
                            {msg.user?.username || 'Usuário'}
                          </span>
                          <span className="text-xs text-[#949ba4]">
                            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                      <p className="break-words text-[#dbdee1]">{msg.content}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Área de Input + Indicador de Digitando Dinâmico */}
            <div className="px-4 pb-6">
              {typingUsers.length > 0 && (
                <div className="mb-1 text-xs text-[#949ba4] flex items-center gap-1">
                  <span className="italic font-medium text-white">
                    {typingUsers.join(', ')}
                  </span>
                  {typingUsers.length === 1 ? ' está digitando...' : ' estão digitando...'}
                </div>
              )}
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-3 rounded-lg bg-[#383a40] px-4 py-2.5"
              >
                <button type="button" className="text-[#b5bac1] hover:text-white">
                  <PlusCircle size={22} />
                </button>
                <input
                  type="text"
                  placeholder={`Conversar em #${currentChannel?.name || 'geral'}`}
                  value={inputMessage}
                  onChange={handleInputChange}
                  className="flex-1 bg-transparent text-white outline-none placeholder:text-[#949ba4]"
                />
                <button type="button" className="text-[#b5bac1] hover:text-white">
                  <Gift size={20} />
                </button>
                <button type="button" className="text-[#b5bac1] hover:text-white">
                  <Smile size={20} />
                </button>
                <button
                  type="submit"
                  className="text-[#b5bac1] hover:text-white disabled:opacity-40"
                  disabled={!inputMessage.trim()}
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </div>

          {/* 4. Lista de membros */}
          {showMembers && (
            <div className="w-60 shrink-0 overflow-y-auto border-l border-[#232428] bg-[#2b2d31] px-2 py-4">
              <p className="mb-2 px-2 text-xs font-semibold uppercase text-[#949ba4]">
                Membros — 1
              </p>
              <div className="flex items-center gap-2 rounded px-2 py-1 hover:bg-[#35373c]">
                <div className="relative">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: avatarColor(username) }}
                  >
                    {getInitials(username)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#2b2d31] bg-[#23a55a]" />
                </div>
                <span className="truncate text-sm text-[#949ba4]">{username}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}