// src/lib/apiConfig.js
// Centralized configuration for backend URL and socket connection.

export const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001';

import { io } from 'socket.io-client';

export const socket = io(API_URL, {
  transports: ['polling', 'websocket'],
  reconnectionAttempts: 10,
});
