# Guia de Deploy - SDR Agent AI

## 📋 Checklist Pré-Deploy

Antes de fazer o deploy, certifique-se de ter:

- [ ] Conta AWS configurada
- [ ] Conta Vercel
- [ ] Projeto Supabase criado
- [ ] API Keys obtidas:
  - Google Gemini API Key
  - Pipefy API Token
  - Cal.com ou Calendly API Key

## 🗄️ 1. Deploy do Banco de Dados (Supabase)

### 1.1 Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova organização (se necessário)
3. Crie um novo projeto
4. Anote a **Database URL** em Settings → Database

### 1.2 Executar Migrations

1. Acesse o SQL Editor no dashboard do Supabase
2. Cole o conteúdo de `database/schema.sql`
3. Execute o script

Ou via CLI:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Executar migrations
psql "postgresql://..." < database/schema.sql
```

### 1.3 Configurar RLS (Row Level Security)

O Supabase pode exigir políticas RLS. Para este projeto, você pode desabilitar temporariamente:

```sql
ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE pipefy_sync DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_data DISABLE ROW LEVEL SECURITY;
```

## 🚀 2. Deploy do Backend (AWS Lambda)

### 2.1 Configurar AWS CLI

```bash
# Instalar AWS CLI
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configurar credenciais
aws configure
```

Insira:
- AWS Access Key ID
- AWS Secret Access Key
- Region: us-east-1
- Output format: json

### 2.2 Instalar Serverless Framework

```bash
npm install -g serverless
```

### 2.3 Configurar Variáveis de Ambiente

Crie `.env` no diretório `backend/`:

```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env` com suas credenciais:

```env
DATABASE_URL=postgresql://user:pass@db.xxx.supabase.co:5432/postgres
GEMINI_API_KEY=AIza...
PIPEFY_API_KEY=Bearer eyJ...
PIPEFY_PIPE_ID=123456
PIPEFY_PHASE_ID=789012
CALENDAR_API_KEY=cal_live_...
CALENDAR_API_URL=https://api.cal.com/v1
CALENDAR_EVENT_TYPE_ID=123
ALLOWED_ORIGINS=https://seu-app.vercel.app
```

### 2.4 Deploy

```bash
cd backend
npm install
npm run build
serverless deploy --stage prod
```

Anote a **API URL** retornada (exemplo: `https://xxx.execute-api.us-east-1.amazonaws.com/prod`)

## 🌐 3. Deploy do Frontend (Vercel)

### 3.1 Opção 1: Via Dashboard (Recomendado)

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Add New" → "Project"
3. Importe o repositório do GitHub
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Adicione variável de ambiente:
   - `VITE_API_URL`: URL da API Lambda (do passo anterior)

6. Clique em "Deploy"

### 3.2 Opção 2: Via CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel --prod
```

Quando solicitado, configure:
- Set up and deploy: Yes
- Which scope: Seu usuário/org
- Link to existing project: No
- Project name: sdr-agent-ai
- Directory: `./`
- Override settings: No

### 3.3 Configurar CORS no Backend

Após deploy do frontend, atualize o backend com a URL do Vercel:

Edite `backend/.env`:
```env
ALLOWED_ORIGINS=https://seu-app.vercel.app,http://localhost:5173
```

Faça redeploy:
```bash
cd backend
serverless deploy --stage prod
```

## 🔧 4. Configuração das Integrações

### 4.1 Google Gemini

1. Acesse [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Crie uma API Key
3. Adicione ao `.env` do backend

### 4.2 Pipefy

1. Acesse Pipefy → Configurações → Tokens de API
2. Gere um novo token
3. Crie um Pipe para "Pré-vendas"
4. Anote o Pipe ID (na URL do pipe)
5. Obtenha o Phase ID da fase inicial:

```graphql
query {
  pipe(id: "SEU_PIPE_ID") {
    phases {
      id
      name
    }
  }
}
```

6. Configure os campos do pipe:
   - nome (texto)
   - email (email)
   - empresa (texto)
   - telefone (telefone)
   - necessidade (texto longo)
   - interesse_confirmado (sim/não)
   - status (lista)
   - meeting_link (link)
   - meeting_datetime (data)

### 4.3 Cal.com

1. Acesse [cal.com/settings/developer/api-keys](https://cal.com/settings/developer/api-keys)
2. Crie uma API Key
3. Crie um Event Type (tipo de evento) para reuniões
4. Anote o Event Type ID

**Alternativa: Calendly**

1. Acesse Calendly → Integrations → API & Webhooks
2. Gere um Personal Access Token
3. Configure `CALENDAR_PROVIDER=calcom` no `.env`

## ✅ 5. Testar o Deploy

### 5.1 Teste o Backend

```bash
curl https://sua-api.execute-api.us-east-1.amazonaws.com/prod/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "services": {
    "database": "ok",
    "api": "ok"
  }
}
```

### 5.2 Teste o Frontend

1. Acesse a URL do Vercel
2. Clique no botão de chat
3. Inicie uma conversa

## 🔍 6. Monitoramento e Logs

### Backend (AWS CloudWatch)

```bash
# Ver logs em tempo real
serverless logs -f api -t

# Ou via AWS Console
# CloudWatch → Log Groups → /aws/lambda/sdr-agent-api-prod-api
```

### Frontend (Vercel)

- Acesse Dashboard → Seu projeto → Deployments
- Clique no deployment → Runtime Logs

### Database (Supabase)

- Dashboard → Database → Logs

## 🐛 7. Troubleshooting

### Erro: "Connection refused"

Verifique se o DATABASE_URL está correto e se o Supabase permite conexões externas.

### Erro: "CORS policy"

Atualize `ALLOWED_ORIGINS` no backend com a URL correta do frontend.

### Erro: "API Key invalid"

Verifique se todas as API Keys estão corretas e não expiraram.

### Erro: "Timeout"

Aumente o timeout da Lambda em `serverless.yml`:

```yaml
provider:
  timeout: 60
```

## 📊 8. Métricas e Custos

### Estimativas de Custo (para 10.000 conversas/mês):

- **AWS Lambda**: ~$5-10/mês
- **Supabase**: Grátis (até 500MB)
- **Vercel**: Grátis (hobby plan)
- **OpenAI API**: Grátis (até certo limite)
- **Cal.com**: Grátis (plano básico)
- **Pipefy**: A partir de $30/mês

**Total estimado**: ~$35-40/mês

## 🔄 9. CI/CD (Opcional)

### GitHub Actions

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd backend && npm install && serverless deploy
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: cd frontend && vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## 📞 Suporte

Para problemas, abra uma issue no GitHub.