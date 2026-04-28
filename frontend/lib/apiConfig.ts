// lib/apiConfig.ts
// Centralized configuration for backend URL and socket connection.
//
// NOTE: This file lives in `/lib` (not `/src/lib`) because the project uses
// the tsconfig path alias "@/*": ["./*"] and imports like `@/lib/...`.

export const API_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001';

// `socket.io-client` depends on browser globals. Even though this module is
// currently imported by a Client Component, Next may still evaluate modules
// during build/analysis. To avoid crashing in Node.js, we initialize lazily
// and only in the browser.
import type { Socket } from 'socket.io-client';

export const socket: Socket = (() => {
    if (typeof window === 'undefined') {
        // Server/build-time: return a harmless placeholder.
        // Client components will run this module again in the browser bundle.
        return {} as Socket;
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { io } = require('socket.io-client') as typeof import('socket.io-client');

    return io(API_URL, {
        transports: ['polling', 'websocket'],
        reconnectionAttempts: 10,
    });
})();
