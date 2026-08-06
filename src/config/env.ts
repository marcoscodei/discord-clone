import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  PORT: z.string().default('3333'),
  JWT_SECRET: z.string(),
  DATABASE_URL: z.string(),
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  console.error('❌ Variáveis de ambiente inválidas!', _env.error.format())
  throw new Error('Variáveis de ambiente inválidas.')
}

export const env = _env.data