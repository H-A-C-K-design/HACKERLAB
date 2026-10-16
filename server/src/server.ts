import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { app } from './app';
import { config } from './config';
import { setupLiveSockets } from './sockets/live.socket';
import { prisma } from './utils/prisma';

const server = http.createServer(app);

const allowedOrigins = [
  config.APP_URL,
  config.CORS_ORIGIN,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

setupLiveSockets(io);

const PORT = config.PORT;

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🛡️  CYBERFORGE ACADEMY BACKEND RUNNING`);
  console.log(`🌐  API URL: ${config.API_URL}`);
  console.log(`⚡  Live streaming: ${config.LIVEKIT_URL}`);
  console.log(`📡  Environment: ${config.NODE_ENV}`);
  console.log(`======================================================\n`);
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP and WebSocket server closed.');
    await prisma.$disconnect();
    console.log('Prisma disconnected.');
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
