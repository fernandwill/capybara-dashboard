import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';

let ioInstance: Server | null = null;

export const initSocket = (server: HttpServer) => {
  ioInstance = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialised');
  }

  return ioInstance;
};

export const hasSocketInstance = () => ioInstance !== null;
