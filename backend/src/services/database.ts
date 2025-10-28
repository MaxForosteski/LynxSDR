import { Pool, PoolClient } from 'pg';
import config from '../config';
import {
  ChatSession,
  ChatMessage,
  Lead,
  Meeting,
  ConversationData,
  DbChatSession,
  DbLead,
  DbMeeting,
  NotFoundError,
} from '../types';

class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: config.database.url,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Erro inesperado no pool de conexões', err);
    });
  }

  async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Query executada', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Erro na query', { text, error });
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  // ===== CHAT SESSIONS =====

  async createSession(sessionId: string): Promise<ChatSession> {
    const expiresAt = new Date(Date.now() + config.session.timeout * 60 * 1000);
    
    const result = await this.query(
      `INSERT INTO chat_sessions (session_id, expires_at, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [sessionId, expiresAt, 'active']
    );

    return this.mapDbSessionToSession(result.rows[0]);
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const result = await this.query(
      `SELECT * FROM chat_sessions WHERE session_id = $1`,
      [sessionId]
    );

    if (result.rows.length === 0) return null;
    return this.mapDbSessionToSession(result.rows[0]);
  }

  async updateSessionEmail(sessionId: string, email: string): Promise<void> {
    await this.query(
      `UPDATE chat_sessions SET email = $1, updated_at = NOW() WHERE session_id = $2`,
      [email, sessionId]
    );
  }

  async updateSessionStatus(sessionId: string, status: string): Promise<void> {
    await this.query(
      `UPDATE chat_sessions SET status = $1, updated_at = NOW() WHERE session_id = $2`,
      [status, sessionId]
    );
  }

  async extendSession(sessionId: string): Promise<void> {
    const newExpiresAt = new Date(Date.now() + config.session.timeout * 60 * 1000);
    await this.query(
      `UPDATE chat_sessions SET expires_at = $1, updated_at = NOW() WHERE session_id = $2`,
      [newExpiresAt, sessionId]
    );
  }

  // ===== CHAT MESSAGES =====

  async saveMessage(sessionId: string, message: ChatMessage): Promise<void> {
    await this.query(
      `INSERT INTO chat_messages (session_id, role, content, created_at)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, message.role, message.content, new Date()]
    );
  }

  async getMessages(sessionId: string, limit = 50): Promise<ChatMessage[]> {
    const result = await this.query(
      `SELECT role, content, created_at as timestamp
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC
       LIMIT $2`,
      [sessionId, limit]
    );

    return result.rows.map(row => ({
      role: row.role,
      content: row.content,
      timestamp: row.timestamp,
    }));
  }

  // ===== LEADS =====

  async createLead(lead: Lead): Promise<Lead> {
    const result = await this.query(
      `INSERT INTO leads (email, name, company, phone, need, interest_confirmed, status, last_contact_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [
        lead.email,
        lead.name,
        lead.company,
        lead.phone,
        lead.need,
        lead.interestConfirmed,
        lead.status,
      ]
    );

    return this.mapDbLeadToLead(result.rows[0]);
  }

  async updateLead(email: string, updates: Partial<Lead>): Promise<Lead> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = this.camelToSnake(key);
        fields.push(`${dbKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    fields.push('updated_at = NOW()');
    fields.push('last_contact_at = NOW()');
    values.push(email);

    const result = await this.query(
      `UPDATE leads SET ${fields.join(', ')} WHERE email = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`Lead com email ${email} não encontrado`);
    }

    return this.mapDbLeadToLead(result.rows[0]);
  }

  async getLeadByEmail(email: string): Promise<Lead | null> {
    const result = await this.query(
      `SELECT * FROM leads WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) return null;
    return this.mapDbLeadToLead(result.rows[0]);
  }

  async updateLeadPipefyId(email: string, pipefyCardId: string): Promise<void> {
    await this.query(
      `UPDATE leads SET pipefy_card_id = $1, updated_at = NOW() WHERE email = $2`,
      [pipefyCardId, email]
    );
  }

  // ===== MEETINGS =====

  async createMeeting(meeting: Meeting): Promise<Meeting> {
    const result = await this.query(
      `INSERT INTO meetings (lead_id, session_id, meeting_datetime, meeting_link, calendar_event_id, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        meeting.leadId,
        meeting.sessionId,
        meeting.meetingDatetime,
        meeting.meetingLink,
        meeting.calendarEventId,
        meeting.status,
        meeting.notes,
      ]
    );

    return this.mapDbMeetingToMeeting(result.rows[0]);
  }

  async updateMeetingStatus(id: string, status: string): Promise<void> {
    await this.query(
      `UPDATE meetings SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id]
    );
  }

  async getMeetingsByLead(leadId: string): Promise<Meeting[]> {
    const result = await this.query(
      `SELECT * FROM meetings WHERE lead_id = $1 ORDER BY meeting_datetime DESC`,
      [leadId]
    );

    return result.rows.map(this.mapDbMeetingToMeeting);
  }

  // ===== CONVERSATION DATA =====

  async saveConversationData(sessionId: string, fieldName: string, fieldValue: string): Promise<void> {
    await this.query(
      `INSERT INTO conversation_data (session_id, field_name, field_value, collected_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (session_id, field_name) 
       DO UPDATE SET field_value = $3, collected_at = NOW()`,
      [sessionId, fieldName, fieldValue]
    );
  }

  async getConversationData(sessionId: string): Promise<ConversationData> {
    const result = await this.query(
      `SELECT field_name, field_value FROM conversation_data WHERE session_id = $1`,
      [sessionId]
    );

    const data: any = { sessionId, collectedFields: [] };
    
    result.rows.forEach(row => {
      data[row.field_name] = row.field_value;
      data.collectedFields.push(row.field_name);
    });

    return data as ConversationData;
  }

  // ===== UTILITY METHODS =====

  private mapDbSessionToSession(row: DbChatSession): ChatSession {
    return {
      id: row.id,
      sessionId: row.session_id,
      email: row.email,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      expiresAt: row.expires_at,
      status: row.status as any,
    };
  }

  private mapDbLeadToLead(row: DbLead): Lead {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      company: row.company,
      phone: row.phone,
      need: row.need,
      interestConfirmed: row.interest_confirmed,
      status: row.status as any,
      pipefyCardId: row.pipefy_card_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastContactAt: row.last_contact_at,
    };
  }

  private mapDbMeetingToMeeting(row: DbMeeting): Meeting {
    return {
      id: row.id,
      leadId: row.lead_id,
      sessionId: row.session_id,
      meetingDatetime: row.meeting_datetime,
      meetingLink: row.meeting_link,
      calendarEventId: row.calendar_event_id,
      status: row.status as any,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export default new DatabaseService();