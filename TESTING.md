# 🧪 Guia de Testes - SDR Agent AI

## 📋 Cenários de Teste

### Cenário 1: Fluxo Completo com Sucesso

**Objetivo**: Lead fornece todas as informações e agenda reunião

**Passos**:
1. Iniciar chat
2. Fornecer nome: "João Silva"
3. Fornecer email: "joao@empresa.com"
4. Fornecer empresa: "Tech Solutions"
5. Descrever necessidade: "Precisamos automatizar nosso processo de vendas"
6. Confirmar interesse: "Sim, gostaria de agendar uma reunião"
7. Escolher horário disponível
8. Verificar confirmação

**Resultado Esperado**:
- ✅ Lead criado no banco de dados
- ✅ Card criado no Pipefy
- ✅ Reunião agendada no Cal.com
- ✅ Link da reunião enviado
- ✅ Status: "meeting_scheduled"

### Cenário 2: Lead Sem Interesse

**Objetivo**: Lead não confirma interesse

**Passos**:
1. Iniciar chat
2. Fornecer nome: "Maria Santos"
3. Fornecer email: "maria@teste.com"
4. Fornecer empresa: "ABC Corp"
5. Descrever necessidade: "Apenas pesquisando"
6. Recusar interesse: "Não, obrigado"

**Resultado Esperado**:
- ✅ Lead criado no banco de dados
- ✅ Card criado no Pipefy com status "closed_lost"
- ✅ Comentário no Pipefy indicando sem interesse
- ⛔ Nenhuma reunião agendada

### Cenário 3: Email Inválido

**Objetivo**: Validar formato de email

**Passos**:
1. Iniciar chat
2. Fornecer nome: "Pedro"
3. Fornecer email inválido: "pedro.email.invalido"
4. Sistema deve solicitar email válido
5. Fornecer email correto: "pedro@empresa.com"

**Resultado Esperado**:
- ✅ Validação de email funcionando
- ✅ Mensagem de erro amigável
- ✅ Solicitar novo email

### Cenário 4: Sessão Expirada

**Objetivo**: Testar timeout de sessão

**Passos**:
1. Iniciar chat
2. Aguardar 31 minutos (timeout padrão: 30 min)
3. Tentar enviar mensagem

**Resultado Esperado**:
- ✅ Mensagem de sessão expirada
- ✅ Opção para reiniciar conversa

### Cenário 5: Retomar Conversa

**Objetivo**: Testar persistência de sessão

**Passos**:
1. Iniciar chat
2. Fornecer algumas informações
3. Fechar navegador
4. Reabrir em menos de 30 minutos
5. Chat deve restaurar conversa

**Resultado Esperado**:
- ✅ Histórico de mensagens restaurado
- ✅ Sessão ativa
- ✅ Dados coletados preservados

### Cenário 6: Lead Existente

**Objetivo**: Atualizar lead que já existe

**Passos**:
1. Criar lead com email "teste@empresa.com"
2. Iniciar nova conversa
3. Usar mesmo email "teste@empresa.com"
4. Fornecer novas informações

**Resultado Esperado**:
- ✅ Card no Pipefy atualizado (não duplicado)
- ✅ Lead no banco atualizado
- ✅ Histórico preservado

## 🔍 Testes Automatizados

### Backend Unit Tests

Crie `backend/src/__tests__/services/gemini.test.ts`:

```typescript
import geminiService from '../../services/gemini';
import { ChatMessage } from '../../types';

describe('Gemini Service', () => {
  it('should generate response from messages', async () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Olá', timestamp: new Date() }
    ];

    const response = await geminiService.chat(messages);
    
    expect(response.message).toBeDefined();
    expect(response.message.length).toBeGreaterThan(0);
  });

  it('should handle function calls', async () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Meu nome é João', timestamp: new Date() }
    ];

    const response = await geminiService.chat(messages);
    
    if (response.functionCalls) {
      expect(response.functionCalls[0].name).toBe('coletar_informacao');
      expect(response.functionCalls[0].args.campo).toBe('nome');
    }
  });
});
```

### Frontend Component Tests

Crie `frontend/src/components/__tests__/ChatMessage.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import ChatMessage from '../ChatMessage';
import { Message } from '../../types';

describe('ChatMessage Component', () => {
  it('should render user message', () => {
    const message: Message = {
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date(),
    };

    render(<ChatMessage message={message} />);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should render loading state', () => {
    const message: Message = {
      id: '1',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    render(<ChatMessage message={message} />);
    
    expect(screen.getByRole('article')).toBeInTheDocument();
  });
});
```

### Integration Tests

Crie `backend/src/__tests__/integration/chat.test.ts`:

```typescript
import request from 'supertest';
import app from '../../app';

describe('Chat API Integration', () => {
  let sessionId: string;

  it('should start new session', async () => {
    const response = await request(app)
      .post('/api/session/start')
      .expect(200);

    expect(response.body.sessionId).toBeDefined();
    sessionId = response.body.sessionId;
  });

  it('should send message', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({
        sessionId,
        message: 'Olá',
      })
      .expect(200);

    expect(response.body.message).toBeDefined();
    expect(response.body.sessionId).toBe(sessionId);
  });

  it('should get history', async () => {
    const response = await request(app)
      .get(`/api/chat/${sessionId}/history`)
      .expect(200);

    expect(response.body.messages).toBeInstanceOf(Array);
    expect(response.body.messages.length).toBeGreaterThan(0);
  });
});
```

## 🚀 Executar Testes

### Backend

```bash
cd backend
npm test
npm test -- --coverage
npm test -- --watch
```

### Frontend

```bash
cd frontend
npm test
npm test -- --coverage
npm test -- --watch
```

## 📊 Checklist de QA

### Funcionalidades Core

- [ ] Chat inicia corretamente
- [ ] Mensagens são enviadas e recebidas
- [ ] IA responde de forma natural
- [ ] Dados são coletados corretamente
- [ ] Validação de email funciona
- [ ] Confirmação de interesse funciona
- [ ] Horários são buscados
- [ ] Reunião é agendada
- [ ] Link da reunião é enviado

### Integrações

- [ ] Pipefy: Card criado
- [ ] Pipefy: Card atualizado (não duplicado)
- [ ] Pipefy: Comentários adicionados
- [ ] Cal.com: Horários retornados
- [ ] Cal.com: Reunião criada
- [ ] Gemini: Respostas naturais
- [ ] Gemini: Function calls executados

### Performance

- [ ] Resposta < 3 segundos
- [ ] Chat suporta 50+ mensagens
- [ ] Sem memory leaks
- [ ] Conexão estável

### UX/UI

- [ ] Responsivo (mobile, tablet, desktop)
- [ ] Acessível (ARIA, keyboard navigation)
- [ ] Loading indicators
- [ ] Mensagens de erro claras
- [ ] Scroll automático
- [ ] Timestamps formatados

### Segurança

- [ ] CORS configurado
- [ ] Rate limiting ativo
- [ ] SQL injection protegido
- [ ] XSS protegido
- [ ] API keys não expostas
- [ ] HTTPS em produção

### Edge Cases

- [ ] Sessão expirada
- [ ] Conexão perdida
- [ ] API indisponível
- [ ] Banco offline
- [ ] Payload muito grande
- [ ] Caracteres especiais
- [ ] Múltiplas abas abertas

## 🐛 Debug

### Ativar Logs Detalhados

Backend `.env`:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Verificar Chamadas de API

```bash
# Backend logs
cd backend
npm run dev

# Ver requests
tail -f logs/app.log
```

### Inspecionar Banco de Dados

```sql
-- Ver sessões ativas
SELECT * FROM chat_sessions WHERE status = 'active';

-- Ver últimas mensagens
SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 10;

-- Ver leads criados hoje
SELECT * FROM leads WHERE DATE(created_at) = CURRENT_DATE;

-- Ver reuniões agendadas
SELECT * FROM meetings WHERE status = 'scheduled';
```

### Testar Endpoints Manualmente

```bash
# Health check
curl http://localhost:3000/health

# Iniciar sessão
curl -X POST http://localhost:3000/api/session/start

# Enviar mensagem
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "abc123",
    "message": "Olá"
  }'
```

## 📈 Métricas de Teste

Objetivos de cobertura:
- **Unit Tests**: > 80%
- **Integration Tests**: > 60%
- **E2E Tests**: Cenários críticos

## 🔄 CI/CD Testing

`.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd backend && npm install && npm test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd frontend && npm install && npm test
```

## ✅ Conclusão

Antes de fazer deploy em produção, garanta que:

1. ✅ Todos os testes passam
2. ✅ Checklist de QA completo
3. ✅ Performance aceitável
4. ✅ Segurança verificada
5. ✅ Documentação atualizada