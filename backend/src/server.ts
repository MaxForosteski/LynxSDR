import app from './app';
import config from './config';
import { cleanupSlotsCache } from './utils/functions';

const PORT = config.port;

// Cleanup periódico do cache
setInterval(() => {
  cleanupSlotsCache();
}, 10 * 60 * 1000); // A cada 10 minutos

app.listen(PORT, () => {
  console.log(`
    LynxSDR API rodando!
      
    Ambiente: ${config.env}
    Porta: ${PORT}
    URL: http://localhost:${PORT}
  `);
});