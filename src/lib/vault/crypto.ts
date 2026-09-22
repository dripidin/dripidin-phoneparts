// DRIPIDIN Cryptographic Engine: AES-256-GCM with Additional Authenticated Data (AAD)
// Condition 3 Compliance: Context-bound encryption preventing ciphertext transposition & tampering

import crypto from 'crypto';

export interface EncryptedSecretPayload {
  ciphertext: string; // base64
  nonce: string;      // base64 (12 bytes)
  authTag: string;    // base64 (16 bytes)
  keyVersion: number;
}

/**
 * Builds deterministic Additional Authenticated Data (AAD) context string
 * strictly binding the ciphertext to the integration identity, key name, and key version.
 */
export function buildAAD(integrationId: string, keyName: string, keyVersion: number): string {
  return `${integrationId}:${keyName}:${keyVersion}`;
}

/**
 * Parses and validates that a base64-encoded key resolves to exactly 32 bytes (256 bits).
 */
export function parseKeyBuffer(base64Key: string): Buffer {
  const buf = Buffer.from(base64Key, 'base64');
  if (buf.length !== 32) {
    throw new Error(
      `[CRITICAL SECURITY ERROR] Invalid vault key length. Expected 32 bytes (256 bits), received ${buf.length} bytes.`
    );
  }
  return buf;
}

/**
 * Generates an independent cryptographically-secure 256-bit key formatted as base64.
 */
export function generateVaultKey(): string {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Encrypts a plaintext secret using AES-256-GCM with fresh 12-byte IV and AAD context binding.
 */
export function encryptSecret(
  plaintext: string,
  keyBuffer: Buffer,
  integrationId: string,
  keyName: string,
  keyVersion: number
): EncryptedSecretPayload {
  if (keyBuffer.length !== 32) {
    throw new Error(`[VAULT ERROR] Key must be 32 bytes, received ${keyBuffer.length}`);
  }

  // 12-byte standard GCM IV
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, nonce);

  // Authenticated Context Binding (AAD)
  const aad = Buffer.from(buildAAD(integrationId, keyName, keyVersion), 'utf8');
  cipher.setAAD(aad);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 128-bit authentication tag

  return {
    ciphertext: encrypted.toString('base64'),
    nonce: nonce.toString('base64'),
    authTag: authTag.toString('base64'),
    keyVersion,
  };
}

/**
 * Decrypts an encrypted secret using AES-256-GCM verifying auth tag and AAD context.
 * Throws immediately if ciphertext, auth tag, or AAD has been altered in any way.
 */
export function decryptSecret(
  payload: { ciphertext: string; nonce: string; authTag: string; keyVersion: number },
  keyBuffer: Buffer,
  integrationId: string,
  keyName: string
): string {
  if (keyBuffer.length !== 32) {
    throw new Error(`[VAULT ERROR] Key must be 32 bytes, received ${keyBuffer.length}`);
  }

  const nonce = Buffer.from(payload.nonce, 'base64');
  const authTag = Buffer.from(payload.authTag, 'base64');
  const ciphertext = Buffer.from(payload.ciphertext, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, nonce);
  const aad = Buffer.from(buildAAD(integrationId, keyName, payload.keyVersion), 'utf8');

  decipher.setAAD(aad);
  decipher.setAuthTag(authTag);

  // Throws OpenSSL authentication error if any byte of ciphertext, authTag, or AAD differs
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}
