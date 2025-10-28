import axios from 'axios';
import config from '../config';
import { Lead, Meeting, IntegrationError } from '../types';

class PipefyService {
  private apiKey: string;
  private apiUrl: string;
  private pipeId: string;
  private phaseId: string;

  constructor() {
    this.apiKey = config.pipefy.apiKey;
    this.apiUrl = config.pipefy.apiUrl;
    this.pipeId = config.pipefy.pipeId;
    this.phaseId = config.pipefy.phaseId;
  }

  private async query(query: string, variables?: any): Promise<any> {
    try {
      const response = await axios.post(
        this.apiUrl,
        { query, variables },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Erro na query Pipefy:', error.response?.data || error.message);
      throw new IntegrationError('Pipefy', error.message);
    }
  }

  async findCardByEmail(email: string): Promise<string | null> {
    const query = `
      query($pipeId: ID!, $search: String!) {
        cards(pipe_id: $pipeId, search: { term: $search }) {
          edges {
            node {
              id
              title
              fields {
                name
                value
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.query(query, {
        pipeId: this.pipeId,
        search: email,
      });

      if (data.cards?.edges?.length > 0) {
        for (const edge of data.cards.edges) {
          const emailField = edge.node.fields.find(
            (f: any) => f.name.toLowerCase().includes('email') || f.name === 'E-mail'
          );
          if (emailField && emailField.value === email) {
            return edge.node.id;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar card:', error);
      return null;
    }
  }

  async createCard(lead: Lead, meeting?: Meeting): Promise<string> {
    const mutation = `
      mutation($pipeId: ID!, $phaseId: ID!, $fields: [FieldValueInput!]!) {
        createCard(input: {
          pipe_id: $pipeId
          phase_id: $phaseId
          fields_attributes: $fields
        }) {
          card {
            id
            title
          }
        }
      }
    `;

    const fields = this.buildFieldsArray(lead, meeting);

    try {
      const data = await this.query(mutation, {
        pipeId: this.pipeId,
        phaseId: this.phaseId,
        fields,
      });

      const cardId = data.createCard.card.id;
      console.log(`Card criado no Pipefy: ${cardId}`);
      return cardId;
    } catch (error: any) {
      console.error('Erro ao criar card:', error);
      throw new IntegrationError('Pipefy', `Erro ao criar card: ${error.message}`);
    }
  }

  async updateCard(cardId: string, lead: Lead, meeting?: Meeting): Promise<void> {
    const mutation = `
      mutation($cardId: ID!, $fields: [FieldValueInput!]!) {
        updateCard(input: {
          id: $cardId
          fields_attributes: $fields
        }) {
          card {
            id
          }
        }
      }
    `;

    const fields = this.buildFieldsArray(lead, meeting);

    try {
      await this.query(mutation, {
        cardId,
        fields,
      });

      console.log(`Card atualizado no Pipefy: ${cardId}`);
    } catch (error: any) {
      console.error('Erro ao atualizar card:', error);
      throw new IntegrationError('Pipefy', `Erro ao atualizar card: ${error.message}`);
    }
  }

  async upsertCard(lead: Lead, meeting?: Meeting): Promise<string> {
    try {
      const existingCardId = await this.findCardByEmail(lead.email);

      if (existingCardId) {
        await this.updateCard(existingCardId, lead, meeting);
        return existingCardId;
      } else {
        return await this.createCard(lead, meeting);
      }
    } catch (error: any) {
      console.error('Erro no upsert do card:', error);
      throw new IntegrationError('Pipefy', error.message);
    }
  }

  async moveCard(cardId: string, phaseId: string): Promise<void> {
    const mutation = `
      mutation($cardId: ID!, $phaseId: ID!) {
        moveCardToPhase(input: {
          card_id: $cardId
          destination_phase_id: $phaseId
        }) {
          card {
            id
          }
        }
      }
    `;

    try {
      await this.query(mutation, {
        cardId,
        phaseId,
      });

      console.log(`Card ${cardId} movido para fase ${phaseId}`);
    } catch (error: any) {
      console.error('Erro ao mover card:', error);
      throw new IntegrationError('Pipefy', error.message);
    }
  }

  async addComment(cardId: string, comment: string): Promise<void> {
    const mutation = `
      mutation($cardId: ID!, $text: String!) {
        createComment(input: {
          card_id: $cardId
          text: $text
        }) {
          comment {
            id
          }
        }
      }
    `;

    try {
      await this.query(mutation, {
        cardId,
        text: comment,
      });

      console.log(`Comentário adicionado ao card ${cardId}`);
    } catch (error: any) {
      console.error('Erro ao adicionar comentário:', error);
    }
  }

  private buildFieldsArray(lead: Lead, meeting?: Meeting): any[] {
    const fields: any[] = [];

    if (lead.name) {
      fields.push({
        field_id: 'nome',
        field_value: lead.name,
      });
    }

    fields.push({
      field_id: 'email',
      field_value: lead.email,
    });

    if (lead.company) {
      fields.push({
        field_id: 'empresa',
        field_value: lead.company,
      });
    }

    if (lead.phone) {
      fields.push({
        field_id: 'telefone',
        field_value: lead.phone,
      });
    }

    if (lead.need) {
      fields.push({
        field_id: 'necessidade',
        field_value: lead.need,
      });
    }

    fields.push({
      field_id: 'interesse_confirmado',
      field_value: lead.interestConfirmed ? 'true' : 'false',
    });

    fields.push({
      field_id: 'status',
      field_value: lead.status,
    });

    if (meeting) {
      if (meeting.meetingLink) {
        fields.push({
          field_id: 'meeting_link',
          field_value: meeting.meetingLink,
        });
      }

      fields.push({
        field_id: 'meeting_datetime',
        field_value: meeting.meetingDatetime.toISOString(),
      });
    }

    return fields;
  }

  async getPhases(): Promise<Array<{ id: string; name: string }>> {
    const query = `
      query($pipeId: ID!) {
        pipe(id: $pipeId) {
          phases {
            id
            name
          }
        }
      }
    `;

    try {
      const data = await this.query(query, { pipeId: this.pipeId });
      return data.pipe.phases;
    } catch (error: any) {
      console.error('Erro ao buscar fases:', error);
      return [];
    }
  }

  async registerNoInterestLead(lead: Lead): Promise<string> {
    lead.status = 'closed_lost';
    lead.interestConfirmed = false;

    const cardId = await this.upsertCard(lead);

    await this.addComment(
      cardId,
      'Lead demonstrou não ter interesse no produto/serviço neste momento.'
    );

    return cardId;
  }

  async registerQualifiedLead(lead: Lead, meeting: Meeting): Promise<string> {
    lead.status = 'meeting_scheduled';
    lead.interestConfirmed = true;

    const cardId = await this.upsertCard(lead, meeting);

    const meetingDate = meeting.meetingDatetime.toLocaleString('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    await this.addComment(
      cardId,
      `✅ Lead qualificado!\n\nReunião agendada para: ${meetingDate}\nLink: ${meeting.meetingLink}`
    );

    return cardId;
  }
}

export default new PipefyService();