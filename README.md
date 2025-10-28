# SDR Agent AI - Agente de Vendas Automatizado

Sistema completo de agente SDR (Sales Development Representative) automatizado com IA, utilizando Gemini 2.5 Flash Lite para conversas naturais, agendamento automático de reuniões e integração com Pipefy.

## 🚀 Tecnologias

### Frontend
- React 18 + Vite
- TypeScript com SWC
- TailwindCSS
- Deploy: Vercel

### Backend
- Node.js + Express
- TypeScript
- AWS Lambda + API Gateway (Serverless)
- PostgreSQL (Supabase)

### Integrações
- OpenAI GPT-4 Turbo (IA conversacional)
- Pipefy (CRM)
- Cal.com / Calendly (Agendamento)

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta AWS (para Lambda)
- Conta Supabase
- API Keys:
  - OpenAI API
  - Pipefy API
  - Cal.com / Calendly API

## 🔧 Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/sdr-agent-ai.git
cd sdr-agent-ai
```

### 2. Configurar Frontend

```bash
cd frontend
npm install
```

Crie `.env` baseado em `.env.example`:

```env
VITE_API_URL=https://sua-api.execute-api.us-east-1.amazonaws.com/prod
```

### 3. Configurar Backend

```bash
cd backend
npm install
```

Crie `.env` baseado em `.env.example`:

```env
# Database
DATABASE_URL=postgresql://user:pass@db.supabase.co:5432/postgres

# OpenAI
OPENAI_API_KEY=sk-proj-your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# Pipefy
PIPEFY_API_KEY=your_pipefy_api_key
PIPEFY_PIPE_ID=your_pipe_id

# Cal.com / Calendly
CALENDAR_API_KEY=your_calendar_api_key
CALENDAR_API_URL=https://api.cal.com/v1

# CORS
ALLOWED_ORIGINS=https://seu-frontend.vercel.app,http://localhost:5173
```

### 4. Configurar Banco de Dados

No Supabase, execute o script SQL:

```bash
psql $DATABASE_URL < database/schema.sql
```

## 🚀 Execução Local

### Frontend

```bash
cd frontend
npm run dev
```

Acesse: http://localhost:5173

### Backend

```bash
cd backend
npm run dev
```

API disponível em: http://localhost:3000

## 📦 Deploy

### Frontend (Vercel)

```bash
cd frontend
vercel --prod
```

Ou conecte o repositório diretamente no dashboard da Vercel.

### Backend (AWS Lambda)

1. Configure AWS CLI:
```bash
aws configure
```

2. Instale Serverless Framework:
```bash
npm install -g serverless
```

3. Deploy:
```bash
cd backend
serverless deploy
```

### Banco de Dados (Supabase)

1. Crie projeto no Supabase
2. Execute migrations em SQL Editor
3. Configure connection string no backend

## 🎯 Funcionalidades

### ✅ Implementadas

- [x] Chat conversacional com IA (Gemini)
- [x] Coleta de informações (nome, email, empresa, necessidade)
- [x] Detecção de interesse de compra
- [x] Sugestão de horários disponíveis
- [x] Agendamento automático de reuniões
- [x] Integração com Pipefy (criação/atualização de cards)
- [x] Persistência de conversas no PostgreSQL
- [x] Sessão por ID anônimo com timeout
- [x] Interface responsiva (mobile-first)
- [x] Acessibilidade (ARIA, navegação por teclado)

## 🏗️ Arquitetura

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────▶│  API Gateway │─────▶│   Lambda    │
│   (Vercel)  │      │     (AWS)    │      │  Functions  │
└─────────────┘      └──────────────┘      └─────────────┘
                                                    │
                     ┌──────────────────────────────┼──────────────┐
                     │                              │              │
                     ▼                              ▼              ▼
              ┌──────────┐                   ┌──────────┐   ┌──────────┐
              │  OpenAI  │                   │  Pipefy  │   │  Cal.com │
              │   API    │                   │   API    │   │   API    │
              └──────────┘                   └──────────┘   └──────────┘
                     
                                    ┌──────────────┐
                                    │  PostgreSQL  │
                                    │  (Supabase)  │
                                    └──────────────┘
```

## 📝 Fluxo de Conversa

1. **Apresentação**: Agente se apresenta e explica o serviço
2. **Descoberta**: Coleta informações do lead
   - Nome
   - Email
   - Empresa
   - Necessidade/Dor
3. **Qualificação**: Pergunta sobre interesse em prosseguir
4. **Agendamento**: Se confirmado interesse:
   - Oferece 2-3 horários disponíveis
   - Agenda reunião
   - Envia link de confirmação
5. **Registro**: Cria/atualiza card no Pipefy

## 🧪 Testes

```bash
# Frontend
cd frontend
npm run test

# Backend
cd backend
npm run test
```

## 🐛 Problemas Conhecidos

Nenhum problema crítico identificado no momento.

## 📄 Licença

MIT

## 👥 Contribuição

Desenvolvido para o Desafio Elite Dev IA

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no GitHub.