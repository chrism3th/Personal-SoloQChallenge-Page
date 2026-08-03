import { customAlphabet } from "nanoid";

// Sin 0/O ni 1/I para que el código sea fácil de transcribir a mano.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const generateCode = customAlphabet(ALPHABET, 8);

export function generateInviteCode(): string {
  return generateCode();
}

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}
