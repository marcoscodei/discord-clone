# 💬 Discord Clone (Full-Stack)

Um clone funcional do Discord desenvolvido como projeto full-stack, focado em interações em tempo real, gerenciamento de servidores, canais e mensagens dinâmicas.

> **⚠️ Status do Projeto:** Este projeto **não está 100% completo**. Ele serve como uma excelente base estruturada de um chat em tempo real, contendo as funcionalidades centrais já implementadas, mas com espaço aberto para novas melhorias e expansões!

---

## ✅ O que já tem no site (Funcionalidades Atuais)

* 🔐 **Autenticação e Sessão:**
  * Telas e fluxos de identificação do usuário.
  * Persistência de sessão local via tokens e dados do usuário salvos no navegador.
  * Botão de logout funcional com encerramento de conexões ativas.
* 🏢 **Gerenciamento de Servidores:**
  * Criação de novos servidores personalizados em tempo real.
  * Barra lateral de servidores dinâmicos com alternância fluida entre eles.
* # **Canais de Texto:**
  * Listagem organizada de canais de texto por servidor.
  * Navegação entre diferentes canais com carregamento automático do histórico de mensagens correspondente.
* ⚡ **Comunicação em Tempo Real (WebSockets):**
  * Conexão via WebSocket integrada por canal (`/ws/:channelId`).
  * Envio e recebimento instantâneo de mensagens para todos os usuários conectados.
  * **CRUD de Mensagens:** Edição e exclusão de mensagens em tempo real (com atualização instantânea na tela de todos os participantes e marcação de `(editado)`).
* 👥 **Interface e Painel de Membros:**
  * Layout fiel inspirado no Discord (Barra de servidores, canais, chat principal e lista de membros).
  * Painel lateral retrátil de membros conectados no canal.
  * Avatares dinâmicos com iniciais e sistema de cores automatizadas.

---

## 🚀 Tecnologias Utilizadas

* **Frontend:** Next.js (App Router), React, Tailwind CSS, TypeScript, Lucide Icons.
* **Backend:** Node.js, Fastify, TypeScript, WebSockets (Fastify WebSocket).
* **Banco de dados & ORM:** Prisma ORM, PostgreSQL.

---

## 📂 Estrutura do Repositório

O projeto é dividido em uma arquitetura limpa e modular:
* `src/websocket/` — Gerenciador de conexões e eventos em tempo real (`ws.gateway.ts`, `ws.manager.ts`).
* `src/modules/` — Módulos do backend separados por responsabilidade (Auth, Servers, Channels, Messages).
* `src/app/` — Páginas e componentes do frontend em Next.js.

---

## ⚙️ Como Executar o Projeto Localmente

### Pré-requisitos
Você precisará ter o **Node.js** e o **Docker** (opcional para o banco) instalados em sua máquina.

### 1. Configurando o Backend
```bash
# Entre na pasta do backend
cd discord-backend

# Instale as dependências
npm install

# Configure as variáveis de ambiente (.env) com sua URL do banco de dados
# Exemplo: DATABASE_URL="postgresql://user:password@localhost:5432/db"

# Execute as migrações do Prisma
npx prisma migrate dev

# Inicie o servidor de desenvolvimento
npm run dev

Feito com ❤️ por Marcos Boni
