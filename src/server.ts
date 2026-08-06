import { app } from './app'
import { env } from './config/env'

app.listen({ port: Number(env.PORT), host: '0.0.0.0' }).then(() => {
  console.log(`🚀 Discord Enterprise Backend rodando na porta ${env.PORT}!`)
})