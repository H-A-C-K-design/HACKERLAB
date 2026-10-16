import crypto from 'crypto';
import argon2 from 'argon2';
import { config } from '../config';

// ── Argon2id Password Hashing ─────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

// ── SHA-256 Token Hashing (Email verification, Password reset, Refresh) ───
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

// ── AES-256-GCM Field Encryption / Decryption ────────────────────────────
function getEncryptionKey(): Buffer {
  const rawKey = config.FIELD_ENCRYPTION_KEY;
  // If base64 encoded 32 bytes or string
  const buf = Buffer.from(rawKey, 'base64');
  if (buf.length === 32) return buf;
  return crypto.createHash('sha256').update(rawKey).digest();
}

export function encryptField(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(12); // 96-bit IV for AES-GCM
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptField(encryptedPayload: string): string {
  if (!encryptedPayload) return '';
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) return encryptedPayload; // Return raw if not valid format

  const [ivHex, authTagHex, cipherHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ── Display Masking Helpers ──────────────────────────────────────────────
export function maskAccount(accountNumber: string): string {
  if (!accountNumber) return '';
  const clean = accountNumber.replace(/\s+/g, '');
  const last4 = clean.slice(-4);
  return `XXXX${last4}`;
}

export function maskPan(pan: string): string {
  if (!pan) return '';
  const clean = pan.trim().toUpperCase();
  const last4 = clean.slice(-4);
  return `XXXXXX${last4}`;
}

export function maskUpi(upiId?: string | null): string {
  if (!upiId) return '';
  const parts = upiId.split('@');
  if (parts.length < 2) return upiId;
  const username = parts[0];
  const handle = parts[1];
  const visible = username.length > 2 ? username.slice(-2) : username;
  return `***${visible}@${handle}`;
}
