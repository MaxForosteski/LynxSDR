-- Schema para SDR Agent AI
-- PostgreSQL no Supabase

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de sessões de chat
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active',
    CONSTRAINT check_status CHECK (status IN ('active', 'expired', 'completed'))
);

-- Tabela de mensagens do chat
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    CONSTRAINT check_role CHECK (role IN ('user', 'assistant', 'system'))
);

-- Tabela de leads
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    company VARCHAR(255),
    phone VARCHAR(50),
    need TEXT,
    interest_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_contact_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'new',
    pipefy_card_id VARCHAR(255),
    CONSTRAINT check_status CHECK (status IN ('new', 'contacted', 'qualified', 'meeting_scheduled', 'closed_won', 'closed_lost'))
);

-- Tabela de reuniões agendadas
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    session_id VARCHAR(255) REFERENCES chat_sessions(session_id),
    meeting_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    meeting_link TEXT,
    calendar_event_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    CONSTRAINT check_status CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'))
);

-- Tabela de integração com Pipefy
CREATE TABLE IF NOT EXISTS pipefy_sync (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    card_id VARCHAR(255) NOT NULL,
    pipe_id VARCHAR(255) NOT NULL,
    phase_id VARCHAR(255),
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status VARCHAR(50) DEFAULT 'synced',
    error_message TEXT,
    CONSTRAINT check_sync_status CHECK (sync_status IN ('synced', 'pending', 'error'))
);

-- Tabela de dados coletados durante conversa
CREATE TABLE IF NOT EXISTS conversation_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    field_value TEXT,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confidence_score DECIMAL(3,2)
);

-- Índices para performance
CREATE INDEX idx_chat_sessions_session_id ON chat_sessions(session_id);
CREATE INDEX idx_chat_sessions_email ON chat_sessions(email);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX idx_chat_sessions_expires_at ON chat_sessions(expires_at);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_pipefy_card_id ON leads(pipefy_card_id);

CREATE INDEX idx_meetings_lead_id ON meetings(lead_id);
CREATE INDEX idx_meetings_session_id ON meetings(session_id);
CREATE INDEX idx_meetings_meeting_datetime ON meetings(meeting_datetime);
CREATE INDEX idx_meetings_status ON meetings(status);

CREATE INDEX idx_pipefy_sync_lead_id ON pipefy_sync(lead_id);
CREATE INDEX idx_pipefy_sync_card_id ON pipefy_sync(card_id);

CREATE INDEX idx_conversation_data_session_id ON conversation_data(session_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at
    BEFORE UPDATE ON meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- View para relatório de conversões
CREATE OR REPLACE VIEW conversion_report AS
SELECT 
    DATE(l.created_at) as date,
    COUNT(l.id) as total_leads,
    COUNT(CASE WHEN l.interest_confirmed THEN 1 END) as interested_leads,
    COUNT(m.id) as meetings_scheduled,
    ROUND(
        COUNT(CASE WHEN l.interest_confirmed THEN 1 END)::NUMERIC / 
        NULLIF(COUNT(l.id), 0) * 100, 2
    ) as conversion_rate
FROM leads l
LEFT JOIN meetings m ON l.id = m.lead_id
GROUP BY DATE(l.created_at)
ORDER BY date DESC;

-- Comentários nas tabelas
COMMENT ON TABLE chat_sessions IS 'Sessões de chat com timeout configurável';
COMMENT ON TABLE chat_messages IS 'Histórico de mensagens de cada sessão';
COMMENT ON TABLE leads IS 'Leads coletados pelo agente';
COMMENT ON TABLE meetings IS 'Reuniões agendadas via Cal.com/Calendly';
COMMENT ON TABLE pipefy_sync IS 'Sincronização com Pipefy CRM';
COMMENT ON TABLE conversation_data IS 'Dados extraídos durante a conversa';