'use client'

import React, { useState } from 'react'
import { api } from '../../services/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dob, setDob] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/users', { username, email, password, dob })
      router.push('/login')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-[#1e1f22]">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, #5865f2 0%, transparent 25%), radial-gradient(circle at 80% 70%, #5865f2 0%, transparent 25%)',
        }}
      />

      <form
        onSubmit={handleRegister}
        className="relative z-10 w-[480px] rounded-[4px] bg-[#313338] p-8 shadow-2xl"
      >
        {/* Botão de fechar, estilo Discord */}
        <Link
          href="/login"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#b5bac1] transition hover:bg-[#3f4147] hover:text-white"
          aria-label="Fechar"
        >
          ✕
        </Link>

        <h2 className="mb-6 text-center text-2xl font-semibold text-white">
          Criar uma conta
        </h2>

        {error && (
          <div className="mb-4 rounded bg-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mb-5">
          <label className="mb-2 block text-xs font-bold uppercase text-[#b5bac1]">
            E-mail <span className="text-[#f23f42]">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[3px] border-none bg-[#1e1f22] p-2.5 text-[15px] text-white outline-none focus:ring-1 focus:ring-[#00a8fc]"
            required
          />
        </div>

        <div className="mb-5">
          <label className="mb-2 block text-xs font-bold uppercase text-[#b5bac1]">
            Nome de usuário <span className="text-[#f23f42]">*</span>
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-[3px] border-none bg-[#1e1f22] p-2.5 text-[15px] text-white outline-none focus:ring-1 focus:ring-[#00a8fc]"
            required
          />
        </div>

        <div className="mb-5">
          <label className="mb-2 block text-xs font-bold uppercase text-[#b5bac1]">
            Senha <span className="text-[#f23f42]">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-[3px] border-none bg-[#1e1f22] p-2.5 text-[15px] text-white outline-none focus:ring-1 focus:ring-[#00a8fc]"
            required
          />
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-xs font-bold uppercase text-[#b5bac1]">
            Data de nascimento <span className="text-[#f23f42]">*</span>
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full rounded-[3px] border-none bg-[#1e1f22] p-2.5 text-[15px] text-white outline-none focus:ring-1 focus:ring-[#00a8fc] [color-scheme:dark]"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[3px] bg-[#5865f2] py-3 text-base font-medium text-white transition hover:bg-[#4752c4] disabled:opacity-60"
        >
          {loading ? 'Criando conta...' : 'Continuar'}
        </button>

        <p className="mt-4 text-[11px] leading-relaxed text-[#949ba4]">
          Ao se registrar, você concorda com os{' '}
          <a href="#" className="text-[#00a8fc] hover:underline">
            Termos de Serviço
          </a>{' '}
          e a{' '}
          <a href="#" className="text-[#00a8fc] hover:underline">
            Política de Privacidade
          </a>{' '}
          da Discord.
        </p>

        <p className="mt-4 text-sm text-[#949ba4]">
          <Link href="/login" className="text-[#00a8fc] hover:underline">
            Já possui uma conta?
          </Link>
        </p>
      </form>
    </div>
  )
}