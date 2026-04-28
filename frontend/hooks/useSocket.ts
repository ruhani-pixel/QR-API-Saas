import { socket as sharedSocket } from '@/lib/apiConfig';

export function useSocket() {
  return sharedSocket;
}
