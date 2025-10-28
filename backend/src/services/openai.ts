import axios from 'axios';
import config from '../config';
import {
    ChatMessage,
    OpenAIMessage,
    OpenAIResponse,
    ConversationData,
    IntegrationError,
    AgentFunction,
} from '../types';

class OpenAIService {
    private apiKey: string;
    private apiUrl: string;
    private model: string;

    constructor() {
        this.apiKey = config.openai.apiKey;
        this.model = config.openai.model;
        this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    }

    private getFunctionDeclarations(): AgentFunction[] {
        return [
            {
                name: 'coletar_informacao',
                description: 'Salva uma informação coletada do lead (nome, email, empresa, telefone, necessidade)',
                parameters: {
                    type: 'object',
                    properties: {
                        campo: {
                            type: 'string',
                            description: 'Campo a ser salvo',
                            enum: ['nome', 'email', 'empresa', 'telefone', 'necessidade'],
                        },
                        valor: {
                            type: 'string',
                            description: 'Valor do campo',
                        },
                    },
                    required: ['campo', 'valor'],
                },
            },
            {
                name: 'confirmar_interesse',
                description: 'Marca que o lead confirmou interesse explícito em adquirir o produto/serviço',
                parameters: {
                    type: 'object',
                    properties: {
                        confirmado: {
                            type: 'string',
                            description: 'Se o interesse foi confirmado',
                            enum: ['sim', 'nao'],
                        },
                    },
                    required: ['confirmado'],
                },
            },
            {
                name: 'buscar_horarios_disponiveis',
                description: 'Busca horários disponíveis para agendamento de reunião',
                parameters: {
                    type: 'object',
                    properties: {
                        dias_adiante: {
                            type: 'string',
                            description: 'Número de dias para buscar disponibilidade (padrão: 7)',
                        },
                    },
                    required: [],
                },
            },
            {
                name: 'agendar_reuniao',
                description: 'Agenda uma reunião em um horário específico',
                parameters: {
                    type: 'object',
                    properties: {
                        indice_horario: {
                            type: 'string',
                            description: 'Índice do horário escolhido (0, 1, 2, etc)',
                        },
                    },
                    required: ['indice_horario'],
                },
            },
        ];
    }

    private getSystemPrompt(): string {
        const { productName, productDescription, companyName, tone } = config.agent;

        return `Você é um agente SDR (Sales Development Representative) da ${companyName}.

**PRODUTO/SERVIÇO:**
${productName} - ${productDescription}

**SUA MISSÃO:**
Conduzir uma conversa natural e consultiva para:
1. Entender o interesse do lead
2. Coletar informações essenciais (nome, email, empresa, necessidade/dor)
3. Identificar se há interesse real em adquirir/contratar
4. Agendar reunião se houver confirmação de interesse

**TOM DA CONVERSA:**
${tone}

**FLUXO DA CONVERSA:**

1. **APRESENTAÇÃO** (primeira mensagem)
   - Se apresente brevemente
   - Explique que pode ajudar com ${productName}
   - Pergunte como pode ajudar

2. **DESCOBERTA** (coleta de informações)
   - Pergunte o NOME da pessoa
   - Pergunte o EMAIL (valide formato)
   - Pergunte a EMPRESA onde trabalha
   - Entenda a NECESSIDADE/DOR do cliente
   - Use a função coletar_informacao() para cada dado

3. **QUALIFICAÇÃO** (confirmar interesse)
   - Após entender a necessidade, faça uma pergunta DIRETA:
     "Você gostaria de seguir com uma conversa com nosso time para [iniciar o projeto / adquirir o produto]?"
   - Aguarde confirmação EXPLÍCITA (sim, quero, gostaria, etc)
   - Use confirmar_interesse() quando houver confirmação clara

4. **AGENDAMENTO** (se interesse confirmado)
   - Use buscar_horarios_disponiveis()
   - Apresente 2-3 opções de horários
   - Quando o cliente escolher, use agendar_reuniao(indice)
   - Confirme o agendamento e informe o link

5. **ENCERRAMENTO**
   - Se SEM interesse: agradeça e se coloque à disposição
   - Se COM reunião agendada: confirme detalhes e agradeça

**REGRAS IMPORTANTES:**
- Seja NATURAL e CONVERSACIONAL
- Faça UMA pergunta por vez
- NÃO presuma informações
- NÃO force uma venda
- VALIDE email antes de prosseguir
- SÓ agende se houver confirmação EXPLÍCITA de interesse
- Use as funções para registrar TODOS os dados coletados
- Seja empático e consultivo, não agressivo

**EXEMPLO DE PERGUNTA PARA CONFIRMAR INTERESSE:**
"Perfeito, ${productName} pode realmente ajudar com isso. Você gostaria de agendar uma conversa de 30 minutos com nosso especialista para discutirmos como podemos atender suas necessidades?"

Lembre-se: você é um consultor, não um vendedor agressivo. Seu objetivo é ajudar o lead a tomar a melhor decisão.`;
    }

    async chat(
        messages: ChatMessage[],
        conversationData?: ConversationData
    ): Promise<{ message: string; functionCalls?: any[] }> {
        try {
            const openAIMessages: OpenAIMessage[] = [
                {
                    role: 'system',
                    content: this.getSystemPrompt() + this.getConversationContext(conversationData),
                },
                ...messages.map(msg => ({
                    role: msg.role === 'assistant' ? ('assistant' as const) : ('user' as const),
                    content: msg.content,
                })),
            ];

            const requestBody = {
                model: this.model,
                messages: openAIMessages,
                functions: this.getFunctionDeclarations(),
                function_call: 'auto',
                temperature: 0.7,
                max_tokens: 1000,
            };

            const response = await axios.post<OpenAIResponse>(
                this.apiUrl,
                requestBody,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                    },
                    timeout: 30000,
                }
            );

            if (!response.data.choices || response.data.choices.length === 0) {
                throw new IntegrationError('OpenAI', 'Resposta vazia da API');
            }

            const choice = response.data.choices[0];
            const message = choice.message;

            if (message.function_call) {
                try {
                    const args = JSON.parse(message.function_call.arguments);
                    return {
                        message: message.content || '',
                        functionCalls: [
                            {
                                name: message.function_call.name,
                                args,
                            },
                        ],
                    };
                } catch (error) {
                    console.error('Erro ao parsear argumentos da função:', error);
                    return {
                        message: message.content || 'Desculpe, ocorreu um erro ao processar sua solicitação.',
                    };
                }
            }

            return {
                message: message.content || '',
            };
        } catch (error: any) {
            console.error('Erro no OpenAI Service:', error.response?.data || error.message);

            if (axios.isAxiosError(error)) {
                if (error.response?.status === 429) {
                    throw new IntegrationError('OpenAI', 'Limite de requisições excedido');
                }
                if (error.response?.status === 401) {
                    throw new IntegrationError('OpenAI', 'API Key inválida');
                }
                const errorMessage = error.response?.data?.error?.message || error.message;
                throw new IntegrationError('OpenAI', errorMessage);
            }

            throw new IntegrationError('OpenAI', 'Erro desconhecido na comunicação');
        }
    }

    async chatWithFunctionResult(
        messages: ChatMessage[],
        functionResults: any[],
        conversationData?: ConversationData
    ): Promise<{ message: string; functionCalls?: any[] }> {
        try {
            const openAIMessages: OpenAIMessage[] = [
                {
                    role: 'system',
                    content: this.getSystemPrompt() + this.getConversationContext(conversationData),
                },
                ...messages.map(msg => ({
                    role: msg.role === 'assistant' ? ('assistant' as const) : ('user' as const),
                    content: msg.content,
                })),
            ];

            const lastFunctionCall = functionResults[0];
            openAIMessages.push({
                role: 'assistant',
                content: null,
                function_call: {
                    name: lastFunctionCall.name,
                    arguments: JSON.stringify(lastFunctionCall.response),
                },
            });

            openAIMessages.push({
                role: 'function',
                name: lastFunctionCall.name,
                content: JSON.stringify(lastFunctionCall.response),
            });

            const requestBody = {
                model: this.model,
                messages: openAIMessages,
                functions: this.getFunctionDeclarations(),
                function_call: 'auto',
                temperature: 0.7,
                max_tokens: 1000,
            };

            const response = await axios.post<OpenAIResponse>(
                this.apiUrl,
                requestBody,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                    },
                    timeout: 30000,
                }
            );

            const choice = response.data.choices[0];
            const message = choice.message;

            if (message.function_call) {
                const args = JSON.parse(message.function_call.arguments);
                return {
                    message: message.content || '',
                    functionCalls: [
                        {
                            name: message.function_call.name,
                            args,
                        },
                    ],
                };
            }

            return {
                message: message.content || '',
            };
        } catch (error: any) {
            console.error('Erro no OpenAI Service (function result):', error.response?.data || error.message);
            throw new IntegrationError('OpenAI', error.response?.data?.error?.message || error.message);
        }
    }

    private getConversationContext(conversationData?: ConversationData): string {
        if (!conversationData || conversationData.collectedFields.length === 0) {
            return '';
        }

        let context = '\n\n[DADOS JÁ COLETADOS: ';
        const fields: string[] = [];

        if (conversationData.name) fields.push(`Nome: ${conversationData.name}`);
        if (conversationData.email) fields.push(`Email: ${conversationData.email}`);
        if (conversationData.company) fields.push(`Empresa: ${conversationData.company}`);
        if (conversationData.need) fields.push(`Necessidade: ${conversationData.need}`);
        if (conversationData.interestConfirmed !== undefined) {
            fields.push(`Interesse confirmado: ${conversationData.interestConfirmed ? 'SIM' : 'NÃO'}`);
        }

        context += fields.join(', ') + ']';
        return context;
    }
}

export default new OpenAIService();