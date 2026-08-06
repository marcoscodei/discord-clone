'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/login')
  }, [router])

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#313338] text-white">
      <p>Carregando...</p>
    </div>
  )
}