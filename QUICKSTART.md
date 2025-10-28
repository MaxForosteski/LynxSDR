# 🚀 Quick Start - SDR Agent AI

Guia rápido para rodar o projeto localmente em 5 minutos.

## 📦 1. Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/sdr-agent-ai.git
cd sdr-agent-ai

# Instale todas as dependências
npm run install:all
```

## 🔑 2. Configurar Variáveis de Ambiente

### Backend

```bash
cd backend
cp .env.example .env
```

Edite `backend/.env` com suas credenciais mínimas:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/sdrdb
OPENAI_API_KEY=sk-proj-your_openai_api_key
OPENAI_MODEL=gpt-4-turbo-preview
PIPEFY_API_KEY=seu_pipefy_token
PIPEFY_PIPE_ID=seu_pipe_id
CALENDAR_API_KEY=sua_calendar_key
```

### Frontend

```bash
cd frontend
cp .env.example .env
```

O arquivo `.env` do frontend deve conter apenas:

```env
VITE_API_URL=http://localhost:3000
```

**Importante**: No Vite, todas as variáveis devem começar com `VITE_` para serem acessíveis no frontend.

## 🗄️ 3. Configurar Banco de Dados Local (Opcional)

### Opção A: Usar Supabase (Recomendado)

1. Crie projeto em [supabase.com](https://supabase.com)
2. Execute `database/schema.sql` no SQL Editor
3. Use a connection string fornecida

### Opção B: PostgreSQL Local

```bash
# Instalar PostgreSQL
# macOS
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Criar database
createdb sdrdb

# Executar migrations
psql sdrdb < database/schema.sql
```

## ▶️ 4. Rodar o Projeto

### Opção 1: Rodar tudo junto (Recomendado)

```bash
npm run dev
```

Isso inicia:
- Backend em http://localhost:3000
- Frontend em http://localhost:5173

### Opção 2: Rodar separadamente

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

## ✅ 5. Testar

1. Abra http://localhost:5173
2. Clique no ícone de chat (canto inferior direito)
3. Comece a conversar!

## 🔧 Configurações Opcionais

### Mudar Produto/Empresa

Edite `backend/.env`:

```env
PRODUCT_NAME=Seu Produto
PRODUCT_DESCRIPTION=Descrição do seu produto
COMPANY_NAME=Sua Empresa
```

### Personalizar Timeout

```env
SESSION_TIMEOUT=30  # minutos
```

### Configurar Timezone

```env
CALENDAR_TIMEZONE=America/Sao_Paulo
```

## 🧪 Modo de Teste (Sem Integrações Externas)

Para testar sem Cal.com, Pipefy, etc:

1. Comente as integrações em `backend/src/services/`
2. Use dados mockados

Exemplo em `backend/src/services/calendar.ts`:

```typescript
async getAvailableSlots(): Promise<TimeSlot[]> {
  // Mock data para testes
  return [
    { datetime: new Date('2024-01-15T10:00:00'), available: true, duration: 30 },
    { datetime: new Date('2024-01-15T14:00:00'), available: true, duration: 30 },
    { datetime: new Date('2024-01-16T10:00:00'), available: true, duration: 30 },
  ];
}
```

## 📝 Comandos Úteis

```bash
# Instalar dependências
npm run install:all

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Verificar tipos TypeScript
npm run type-check

# Lint
npm run lint

# Testes
npm run test

# Deploy
npm run deploy
```

## 🐛 Problemas Comuns

### Porta já em uso

```bash
# Mudar porta do backend
PORT=3001 npm run dev:backend

# Mudar porta do frontend (editar vite.config.ts)
server: { port: 5174 }
```

### Erro de conexão com banco

Verifique se:
1. PostgreSQL está rodando
2. DATABASE_URL está correto
3. Database existe

```bash
# Testar conexão
psql "postgresql://..."
```

### CORS Error

Certifique-se que o frontend está em `ALLOWED_ORIGINS`:

```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## 📚 Próximos Passos

1. ✅ Configurar integrações (Pipefy, Cal.com)
2. ✅ Personalizar mensagens do agente
3. ✅ Adicionar campos customizados
4. ✅ Deploy em produção

Veja [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) para instruções completas de deploy.

## 💡 Dicas

- Use **Gemini 2.0 Flash** para respostas mais rápidas
- Configure **rate limiting** para evitar abuso
- Ative **logs** detalhados durante desenvolvimento
- Teste com diferentes cenários de conversa

## 🆘 Suporte

- 📖 Documentação completa: [README.md](./README.md)
- 🚀 Guia de deploy: [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)
- 🐛 Reportar bugs: GitHub Issues
- 💬 Dúvidas: Abra uma discussion no GitHub