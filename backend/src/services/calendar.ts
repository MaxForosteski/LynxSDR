import axios from 'axios';
import config from '../config';
import { TimeSlot, IntegrationError } from '../types';

class CalendarService {
  private apiKey: string;
  private apiUrl: string;
  private eventTypeId: string;
  private provider: 'calcom' | 'calendly';
  private timezone: string;

  constructor() {
    this.apiKey = config.calendar.apiKey;
    this.apiUrl = config.calendar.apiUrl;
    this.eventTypeId = config.calendar.eventTypeId;
    this.provider = config.calendar.provider;
    this.timezone = config.calendar.timezone;
  }

  async getAvailableSlots(daysAhead = 7): Promise<TimeSlot[]> {
    try {
      return await this.getCalcomSlots(daysAhead);
    } catch (error: any) {
      console.error('Erro ao buscar horários:', error.response?.data || error.message);
      throw new IntegrationError('Calendar', error.message);
    }
  }

  async scheduleMinutos(
    slot: TimeSlot,
    attendee: { name: string; email: string; company?: string }
  ): Promise<{ eventId: string; meetingLink: string }> {
    try {
      return await this.scheduleCalcomMeeting(slot, attendee);
    } catch (error: any) {
      console.error('Erro ao agendar reunião:', error.response?.data || error.message);
      throw new IntegrationError('Calendar', error.message);
    }
  }

  async cancelMeeting(eventId: string): Promise<boolean> {
    try {
      return await this.cancelCalcomMeeting(eventId);
    } catch (error: any) {
      console.error('Erro ao cancelar reunião:', error.message);
      throw new IntegrationError('Calendar', error.message);
    }
  }

  // ===== CAL.COM IMPLEMENTATION =====

  private async getCalcomSlots(daysAhead: number): Promise<TimeSlot[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    const response = await axios.get(
      `${this.apiUrl}/slots`,
      {
        params: {
          apiKey: this.apiKey,
          eventTypeId: this.eventTypeId,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          timeZone: this.timezone,
        },
        headers: {
          Authorization: `API-Key ${this.apiKey}`,
        },
      }
    );

    const slots: TimeSlot[] = [];

    if (response.data.slots) {
      // Cal.com retorna slots por dia
      Object.values(response.data.slots).forEach((daySlots: any) => {
        daySlots.forEach((slot: any) => {
          slots.push({
            datetime: new Date(slot.time),
            available: true,
            duration: 30, // padrão 30 minutos
          });
        });
      });
    }

    // Limitar a 5 slots mais próximos
    return slots.slice(0, 5);
  }

  private async scheduleCalcomMeeting(
    slot: TimeSlot,
    attendee: { name: string; email: string; company?: string }
  ): Promise<{ eventId: string; meetingLink: string }> {
    const response = await axios.post(
      `${this.apiUrl}/bookings`,
      {
        eventTypeId: this.eventTypeId,
        start: slot.datetime.toISOString(),
        responses: {
          name: attendee.name,
          email: attendee.email,
          notes: attendee.company ? `Empresa: ${attendee.company}` : '',
        },
        timeZone: this.timezone,
        language: 'pt-BR',
        metadata: {
          source: 'sdr-agent-ai',
        },
      },
      {
        params: {
          apiKey: this.apiKey
        },
        headers: {
          Authorization: `API-Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      eventId: response.data.id || response.data.uid,
      meetingLink: response.data.meetingUrl || response.data.url,
    };
  }

  private async cancelCalcomMeeting(eventId: string): Promise<boolean> {
    await axios.delete(`${this.apiUrl}/bookings/${eventId}`, {
      headers: {
        Authorization: `API-Key ${this.apiKey}`,
      },
    });
    return true;
  }

  // ===== UTILITY METHODS =====

  formatSlot(slot: TimeSlot, index: number): string {
    const date = slot.datetime;
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.timezone,
    };

    const formatted = date.toLocaleDateString('pt-BR', options);
    return `${index + 1}. ${formatted}`;
  }

  async validateSlot(slot: TimeSlot): Promise<boolean> {
    const now = new Date();
    if (slot.datetime < now) {
      return false;
    }

    try {
      const availableSlots = await this.getAvailableSlots(7);
      return availableSlots.some(
        s => s.datetime.getTime() === slot.datetime.getTime()
      );
    } catch (error) {
      console.error('Erro ao validar slot:', error);
      return false;
    }
  }
}

export default new CalendarService();