import databaseService from '../services/database';
import calendarService from '../services/calendar';
import pipefyService from '../services/pipefy';
import { TimeSlot, Lead, Meeting } from '../types';

const slotsCache = new Map<string, TimeSlot[]>();

export async function executeFunctionCall(
  functionName: string,
  args: Record<string, any>,
  sessionId: string
): Promise<any> {
  console.warn(`Executando função: ${functionName}`, args);
  try {
    switch (functionName) {
      case 'coletar_informacao':
        return await coletarInformacao(sessionId, args.campo, args.valor);

      case 'confirmar_interesse':
        return await confirmarInteresse(sessionId, args.confirmado);

      case 'buscar_horarios_disponiveis':
        return await buscarHorariosDisponiveis(sessionId, args.dias_adiante);

      case 'agendar_reuniao':
        return await agendarReuniao(sessionId, args.indice_horario);

      default:
        return {
          success: false,
          error: `Função desconhecida: ${functionName}`,
        };
    }
  } catch (error: any) {
    console.error(`Erro ao executar função ${functionName}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function coletarInformacao(
  sessionId: string,
  campo: string,
  valor: string
): Promise<any> {
  try {
    const campoMap: Record<string, string> = {
      nome: 'name',
      email: 'email',
      empresa: 'company',
      telefone: 'phone',
      necessidade: 'need',
    };

    const dbField = campoMap[campo] || campo;

    if (campo === 'email' && !isValidEmail(valor)) {
      return {
        success: false,
        error: 'Email inválido. Por favor, forneça um email válido.',
      };
    }

    await databaseService.saveConversationData(sessionId, dbField, valor);

    if (campo === 'email') {
      await databaseService.updateSessionEmail(sessionId, valor);
    }

    return {
      success: true,
      data: {
        campo,
        valor,
        mensagem: `${campo} salvo com sucesso.`,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function confirmarInteresse(
  sessionId: string,
  confirmado: string
): Promise<any> {
  try {
    const interesseConfirmado = confirmado.toLowerCase() === 'sim';

    await databaseService.saveConversationData(
      sessionId,
      'interestConfirmed',
      interesseConfirmado.toString()
    );

    const conversationData = await databaseService.getConversationData(sessionId);

    const lead: Lead = {
      email: conversationData.email || '',
      name: conversationData.name,
      company: conversationData.company,
      phone: conversationData.phone,
      need: conversationData.need,
      interestConfirmed: interesseConfirmado,
      status: interesseConfirmado ? 'qualified' : 'contacted',
    };

    if (!lead.email) {
      return {
        success: false,
        error: 'Email não foi coletado ainda.',
      };
    }

    const existingLead = await databaseService.getLeadByEmail(lead.email);

    if (existingLead) {
      await databaseService.updateLead(lead.email, lead);
    } else {
      await databaseService.createLead(lead);
    }

    if (!interesseConfirmado) {
      const cardId = await pipefyService.registerNoInterestLead(lead);
      await databaseService.updateLeadPipefyId(lead.email, cardId);
    }

    return {
      success: true,
      data: {
        interesseConfirmado,
        mensagem: interesseConfirmado
          ? 'Interesse confirmado! Vamos agendar uma reunião.'
          : 'Entendido. Agradecemos seu tempo.',
      },
    };
  } catch (error: any) {
    console.error('Erro ao confirmar interesse:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function buscarHorariosDisponiveis(
  sessionId: string,
  diasAdiante?: string
): Promise<any> {
  try {
    const days = diasAdiante ? parseInt(diasAdiante) : 7;
    const slots = await calendarService.getAvailableSlots(days);

    if (slots.length === 0) {
      return {
        success: false,
        error: 'Não há horários disponíveis no momento.',
      };
    }

    slotsCache.set(sessionId, slots);

    const formattedSlots = slots
      .slice(0, 3)
      .map((slot, index) => calendarService.formatSlot(slot, index));

    return {
      success: true,
      data: {
        slots: formattedSlots,
        total: slots.length,
        mensagem: 'Aqui estão os horários disponíveis:',
      },
    };
  } catch (error: any) {
    console.error('Erro ao buscar horários:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function agendarReuniao(
  sessionId: string,
  indiceHorario: string
): Promise<any> {
  try {
    const index = parseInt(indiceHorario);

    const slots = slotsCache.get(sessionId);

    if (!slots || slots.length === 0) {
      return {
        success: false,
        error: 'Horários não encontrados. Por favor, busque os horários novamente.',
      };
    }

    if (index < 0 || index >= slots.length) {
      return {
        success: false,
        error: 'Índice de horário inválido.',
      };
    }

    const selectedSlot = slots[index];

    const conversationData = await databaseService.getConversationData(sessionId);

    if (!conversationData.email || !conversationData.name) {
      return {
        success: false,
        error: 'Nome e email são obrigatórios para agendar uma reunião.',
      };
    }

    const { eventId, meetingLink } = await calendarService.scheduleMinutos(
      selectedSlot,
      {
        name: conversationData.name,
        email: conversationData.email,
        company: conversationData.company,
      }
    );

    let lead = await databaseService.getLeadByEmail(conversationData.email);

    if (!lead) {
      lead = await databaseService.createLead({
        email: conversationData.email,
        name: conversationData.name,
        company: conversationData.company,
        phone: conversationData.phone,
        need: conversationData.need,
        interestConfirmed: true,
        status: 'meeting_scheduled',
      });
    } else {
      lead = await databaseService.updateLead(conversationData.email, {
        status: 'meeting_scheduled',
        interestConfirmed: true,
      });
    }

    const meeting: Meeting = {
      leadId: lead.id!,
      sessionId,
      meetingDatetime: selectedSlot.datetime,
      meetingLink,
      calendarEventId: eventId,
      status: 'scheduled',
    };

    const createdMeeting = await databaseService.createMeeting(meeting);

    const cardId = await pipefyService.registerQualifiedLead(lead, createdMeeting);
    await databaseService.updateLeadPipefyId(conversationData.email, cardId);

    slotsCache.delete(sessionId);

    await databaseService.updateSessionStatus(sessionId, 'completed');

    const formattedDate = selectedSlot.datetime.toLocaleString('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    return {
      success: true,
      data: {
        meetingLink,
        meetingDatetime: selectedSlot.datetime.toISOString(),
        formattedDate,
        mensagem: `Reunião agendada com sucesso para ${formattedDate}!`,
      },
    };
  } catch (error: any) {
    console.error('Erro ao agendar reunião:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function cleanupSlotsCache(): void {
  const now = Date.now();
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutos

  if (slotsCache.size > 100) {
    slotsCache.clear();
    console.log('Cache de slots limpo');
  }
}