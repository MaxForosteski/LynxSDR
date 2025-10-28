import serverless from 'serverless-http';
import app from './app';

// Wrapper para AWS Lambda
export const handler = serverless(app, {
  request: (request: any, event: any, context: any) => {
    // Adicionar informações do evento Lambda ao request
    request.context = context;
    request.event = event;
  },
});