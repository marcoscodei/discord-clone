'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
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
  Pencil,
  Trash2,
  AtSign,
} from 'lucide-react'

interface Server {
  id: string
  name: string
  imageUrl?: string | null
  channels: { id: string; name: string }[]
}

interface Message {
  id: string
  content: string
  edited?: boolean
  createdAt?: string
  user: { id?: string; username: string; avatarUrl?: string | null }
}

export default function ChatPage() {
  const router = useRouter()
  const [servers, setServers] = useState<Server[]>([])
  const [currentServer, setCurrentServer] = useState<Server | null>(null)
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [newServerName, setNewServerName] = useState('')
  const [showNewServerInput, setShowNewServerInput] = useState(false)
  const [channelsOpen, setChannelsOpen] = useState(true)
  const [showMembers, setShowMembers] = useState(true)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [hoveredServerId, setHoveredServerId] = useState<string | null>(null)

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTypingSentRef = useRef<number>(0)

  const [userId, setUserId] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    try {
      for (const key of ['@discord:user', 'user', '@user', 'auth_user']) {
        const saved = localStorage.getItem(key)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.id) return parsed.id
        }
      }
      const token = localStorage.getItem('@discord:token') || localStorage.getItem('token')
      if (token) {
        const base64Url = token.split('.')[1]
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const payload = JSON.parse(atob(base64))
          if (payload.id) return payload.id
        }
      }
    } catch (e) {}
    return ''
  })

  const [username, setUsername] = useState<string>(() => {
    if (typeof window === 'undefined') return 'Usuário'
    try {
      for (const key of ['@discord:user', 'user', '@user', 'auth_user']) {
        const saved = localStorage.getItem(key)
        if (saved) {
          const parsed = JSON.parse(saved)
          const name = parsed.username || parsed.name || parsed.displayName
          if (name) return name
        }
      }
      const token = localStorage.getItem('@discord:token') || localStorage.getItem('token')
      if (token) {
        const base64Url = token.split('.')[1]
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const payload = JSON.parse(atob(base64))
          const name = payload.username || payload.name || payload.sub
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

  useEffect(() => {
    if (!currentChannelId) return

    setMessagesLoading(true)
    api.get(`/channels/${currentChannelId}/messages`).then((res) => {
      setMessages(res.data)
    }).catch((err) => {
      console.error('Erro ao buscar histórico de mensagens', err)
    }).finally(() => {
      setMessagesLoading(false)
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
        setTypingUser(null)
      } else if (data.event === 'MESSAGE_UPDATED') {
        setMessages((prev) => prev.map((m) => (m.id === data.data.id ? data.data : m)))
      } else if (data.event === 'MESSAGE_DELETED') {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId))
      } else if (data.event === 'TYPING') {
        if (data.username && data.username !== username) {
          setTypingUser(data.username)
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000)
        }
      } else if (data.id && data.content) {
        setMessages((prev) => [...prev, data])
      }
    }

    return () => {
      ws.close()
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [currentChannelId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleInputChange(value: string) {
    setInputMessage(value)
    const now = Date.now()
    if (wsRef.current && now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now
      wsRef.current.send(JSON.stringify({ event: 'TYPING', username }))
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

    wsRef.current.send(JSON.stringify({ userId, content: inputMessage }))
    setInputMessage('')
  }

  function saveEdit(messageId: string) {
    if (!wsRef.current || !editText.trim()) return
    wsRef.current.send(
      JSON.stringify({ event: 'EDIT_MESSAGE', messageId, content: editText })
    )
    setEditingMessageId(null)
    setEditText('')
  }

  function deleteMessage(messageId: string) {
    if (!wsRef.current) return
    wsRef.current.send(JSON.stringify({ event: 'DELETE_MESSAGE', messageId }))
  }

  function handleLogout() {
    localStorage.removeItem('@discord:token')
    localStorage.removeItem('@discord:user')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (wsRef.current) wsRef.current.close()
    router.push('/')
  }

  function getInitials(name: string) {
    return name ? name.substring(0, 2).toUpperCase() : 'US'
  }

  function avatarColor(name: string) {
    const colors = ['#5865f2', '#eb459e', '#23a55a', '#f0b232', '#f23f42', '#3ba55d', '#9b59b6', '#1abc9c']
    const idx = (name || 'U').charCodeAt(0) % colors.length
    return colors[idx]
  }

  function formatMessageTime(iso?: string) {
    const date = iso ? new Date(iso) : new Date()
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    if (isToday) return `Hoje às ${time}`
    return `${date.toLocaleDateString('pt-BR')} às ${time}`
  }

  function formatShortTime(iso?: string) {
    const date = iso ? new Date(iso) : new Date()
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  function Avatar({ name, url, size = 40 }: { name: string; url?: string | null; size?: number }) {
    if (url) {
      return (
        <img
          src={url}
          alt={name}
          width={size}
          height={size}
          className="shrink-0 rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      )
    }
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
        style={{ width: size, height: size, backgroundColor: avatarColor(name), fontSize: size * 0.35 }}
      >
        {getInitials(name)}
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#313338] text-white antialiased">
      {/* 1. Barra de servidores */}
      <div className="flex w-[72px] flex-col items-center gap-2 bg-[#1e1f22] py-3">
        <div className="group relative">
          <button
            onClick={() => setCurrentServer(null)}
            className={`relative flex h-12 w-12 items-center justify-center rounded-3xl bg-[#5865f2] transition-all duration-200 hover:rounded-2xl ${
              !currentServer ? '!rounded-2xl' : ''
            }`}
          >
            <span
              className={`absolute -left-3 rounded-full bg-white transition-all duration-200 ${
                !currentServer ? 'h-5 w-1' : 'h-0 w-1 group-hover:h-2'
              }`}
            />
            <Inbox size={22} />
          </button>
          <div className="pointer-events-none absolute left-16 top-1/2 z-50 -translate-y-1/2 scale-95 whitespace-nowrap rounded-md bg-black px-3 py-1.5 text-xs font-semibold opacity-0 shadow-lg transition-all duration-100 group-hover:scale-100 group-hover:opacity-100">
            Mensagens Diretas
          </div>
        </div>

        <div className="my-1 h-[2px] w-8 rounded bg-[#35373c]" />

        {servers.map((server) => (
          <div key={server.id} className="group relative">
            <button
              onClick={() => {
                setCurrentServer(server)
                if (server.channels.length > 0) setCurrentChannelId(server.channels[0].id)
                setMessages([])
              }}
              onMouseEnter={() => setHoveredServerId(server.id)}
              onMouseLeave={() => setHoveredServerId(null)}
              className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-3xl bg-[#313338] text-[15px] font-semibold transition-all duration-200 hover:rounded-2xl hover:bg-[#5865f2] ${
                currentServer?.id === server.id ? '!rounded-2xl !bg-[#5865f2]' : ''
              }`}
            >
              <span
                className={`absolute -left-3 rounded-full bg-white transition-all duration-200 ${
                  currentServer?.id === server.id
                    ? 'h-10 w-1'
                    : hoveredServerId === server.id
                      ? 'h-5 w-1'
                      : 'h-2 w-1 opacity-0'
                }`}
              />
              {server.imageUrl ? (
                <img src={server.imageUrl} alt={server.name} className="h-full w-full object-cover" />
              ) : (
                getInitials(server.name)
              )}
            </button>
            <div className="pointer-events-none absolute left-16 top-1/2 z-50 -translate-y-1/2 scale-95 whitespace-nowrap rounded-md bg-black px-3 py-1.5 text-xs font-semibold opacity-0 shadow-lg transition-all duration-100 group-hover:scale-100 group-hover:opacity-100">
              {server.name}
            </div>
          </div>
        ))}

        <div className="group relative">
          <button
            onClick={() => setShowNewServerInput((v) => !v)}
            className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#313338] text-[#23a55a] transition-all duration-200 hover:rounded-2xl hover:bg-[#23a55a] hover:text-white"
          >
            <Plus size={24} />
          </button>
          <div className="pointer-events-none absolute left-16 top-1/2 z-50 -translate-y-1/2 scale-95 whitespace-nowrap rounded-md bg-black px-3 py-1.5 text-xs font-semibold opacity-0 shadow-lg transition-all duration-100 group-hover:scale-100 group-hover:opacity-100">
            Adicionar um servidor
          </div>
        </div>

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
        <button className="flex h-12 items-center justify-between border-b border-[#1f2023] px-4 text-[15px] font-semibold shadow-sm transition-colors hover:bg-[#35373c]/40">
          <span className="truncate">{currentServer ? currentServer.name : 'Mensagens Diretas'}</span>
          <ChevronDown size={18} className="shrink-0 text-[#949ba4]" />
        </button>

        <div className="flex-1 overflow-y-auto px-2 pt-3">
          <button
            onClick={() => setChannelsOpen((v) => !v)}
            className="mb-1 flex w-full items-center gap-1 px-1 text-xs font-semibold uppercase text-[#949ba4] transition-colors hover:text-[#dbdee1]"
          >
            <ChevronDown
              size={12}
              className={`transition-transform duration-150 ${channelsOpen ? '' : '-rotate-90'}`}
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
                className={`group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-[15px] font-medium text-[#949ba4] transition-colors hover:bg-[#35373c] hover:text-[#dbdee1] ${
                  currentChannelId === channel.id ? 'bg-[#404249] text-white' : ''
                }`}
              >
                <Hash size={20} className="shrink-0 text-[#80848e] group-hover:text-[#b5bac1]" />
                <span className="truncate">{channel.name}</span>
              </button>
            ))}

          {currentServer && currentServer.channels.length === 0 && (
            <p className="px-2 text-xs text-[#6d6f78]">Nenhum canal ainda.</p>
          )}
        </div>

        {/* Painel do usuário */}
        <div className="flex h-[52px] items-center gap-1.5 bg-[#232428] px-2">
          <div className="relative">
            <Avatar name={username} size={32} />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#232428] bg-[#23a55a]" />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-semibold text-white">{username}</p>
            <p className="text-[10px] text-[#949ba4]">Online</p>
          </div>
          <button title="Microfone" className="rounded p-1 text-[#b5bac1] transition-colors hover:bg-[#3f4147] hover:text-white">
            <Mic size={16} />
          </button>
          <button title="Fones de ouvido" className="rounded p-1 text-[#b5bac1] transition-colors hover:bg-[#3f4147] hover:text-white">
            <Headphones size={16} />
          </button>
          <button title="Configurações" className="rounded p-1 text-[#b5bac1] transition-colors hover:bg-[#3f4147] hover:text-white">
            <Settings size={16} />
          </button>
          <button
            onClick={handleLogout}
            title="Sair da conta"
            className="rounded p-1 text-[#f23f42] transition-colors hover:bg-[#3f4147]"
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
            <Bell size={20} className="cursor-pointer transition-colors hover:text-white" />
            <Pin size={20} className="cursor-pointer transition-colors hover:text-white" />
            <Users
              size={20}
              onClick={() => setShowMembers((v) => !v)}
              className={`cursor-pointer transition-colors hover:text-white ${showMembers ? 'text-white' : ''}`}
            />
            <div className="flex items-center rounded bg-[#1e1f22] px-2 transition-all focus-within:ring-1 focus-within:ring-[#00a8fc]">
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
              {messagesLoading && (
                <div className="flex h-full items-center justify-center text-sm text-[#6d6f78]">
                  Carregando mensagens...
                </div>
              )}

              {!messagesLoading && messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-[#6d6f78]">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2b2d31]">
                    <Hash size={32} />
                  </div>
                  <p className="text-lg font-semibold text-white">
                    Bem-vindo a #{currentChannel?.name || 'geral'}!
                  </p>
                  <p className="text-sm">Este é o início do canal. Envie a primeira mensagem.</p>
                </div>
              )}

              {messages.map((msg, index) => {
                const prev = messages[index - 1]
                const grouped = !!prev && prev.user?.username === msg.user?.username
                const isOwnMessage = msg.user?.username === username

                return (
                  <div
                    key={msg.id ?? index}
                    className={`group relative flex items-start gap-3 rounded px-2 py-0.5 transition-colors hover:bg-[#2e3035] ${
                      grouped ? 'mt-0' : 'mt-3'
                    }`}
                  >
                    {!grouped ? (
                      <Avatar name={msg.user?.username || 'Usuário'} url={msg.user?.avatarUrl} size={40} />
                    ) : (
                      <div className="w-10 shrink-0 pt-0.5 text-center text-[10px] text-[#949ba4] opacity-0 group-hover:opacity-100">
                        {formatShortTime(msg.createdAt)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      {!grouped && (
                        <div className="flex items-baseline gap-2">
                          <span className="cursor-pointer font-semibold text-white hover:underline">
                            {msg.user?.username || 'Usuário'}
                          </span>
                          <span className="text-xs text-[#949ba4]">
                            {formatMessageTime(msg.createdAt)}
                          </span>
                        </div>
                      )}

                      {editingMessageId === msg.id ? (
                        <div className="mt-1 flex flex-col gap-1">
                          <input
                            autoFocus
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(msg.id)
                              if (e.key === 'Escape') setEditingMessageId(null)
                            }}
                            className="rounded bg-[#383a40] p-1.5 text-white outline-none ring-1 ring-[#00a8fc]"
                          />
                          <div className="text-[10px] text-[#949ba4]">
                            escape para{' '}
                            <button onClick={() => setEditingMessageId(null)} className="text-[#00a8fc] hover:underline">
                              cancelar
                            </button>{' '}
                            • enter para{' '}
                            <button onClick={() => saveEdit(msg.id)} className="text-[#00a8fc] hover:underline">
                              salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="break-words leading-[1.375rem] text-[#dbdee1]">
                          {msg.content}
                          {msg.edited && (
                            <span className="ml-1 text-[10px] text-[#949ba4]">(editado)</span>
                          )}
                        </p>
                      )}
                    </div>

                    {isOwnMessage && editingMessageId !== msg.id && (
                      <div className="absolute right-4 top-0 hidden -translate-y-1/2 items-center gap-0.5 rounded-lg border border-[#1e1f22] bg-[#313338] p-1 shadow-md group-hover:flex">
                        <button
                          onClick={() => {
                            setEditingMessageId(msg.id)
                            setEditText(msg.content)
                          }}
                          className="rounded p-1.5 text-[#b5bac1] transition-colors hover:bg-[#3f4147] hover:text-white"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="rounded p-1.5 text-[#b5bac1] transition-colors hover:bg-[#3f4147] hover:text-[#f23f42]"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 pb-6">
              {typingUser && (
                <div className="mb-1 flex items-center gap-1.5 px-1 text-xs text-[#949ba4]">
                  <span className="flex gap-0.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#949ba4] [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#949ba4] [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#949ba4]" />
                  </span>
                  <span>
                    <strong className="font-semibold text-[#dbdee1]">{typingUser}</strong> está digitando...
                  </span>
                </div>
              )}
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-3 rounded-lg bg-[#383a40] px-4 py-2.5 transition-shadow focus-within:shadow-lg"
              >
                <button type="button" className="text-[#b5bac1] transition-colors hover:text-white">
                  <PlusCircle size={22} />
                </button>
                <input
                  type="text"
                  placeholder={`Conversar em #${currentChannel?.name || 'geral'}`}
                  value={inputMessage}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="flex-1 bg-transparent text-white outline-none placeholder:text-[#949ba4]"
                />
                <button type="button" className="text-[#b5bac1] transition-colors hover:text-white">
                  <Gift size={20} />
                </button>
                <button type="button" className="text-[#b5bac1] transition-colors hover:text-white">
                  <Smile size={20} />
                </button>
                <button
                  type="submit"
                  className="text-[#b5bac1] transition-colors hover:text-white disabled:opacity-40"
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
              <p className="mb-2 px-2 text-xs font-semibold uppercase text-[#949ba4]">Online — 1</p>
              <div className="group flex items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-[#35373c]">
                <div className="relative">
                  <Avatar name={username} size={32} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#2b2d31] bg-[#23a55a]" />
                </div>
                <span className="truncate text-sm font-medium text-[#dbdee1] group-hover:text-white">
                  {username}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}