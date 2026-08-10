import * as crypto from 'crypto';

export function deriveWingKey(clientId: string): Buffer {
  // Formula: key = clientID.padEnd(32, '0').slice(0, 32)
  const padded = clientId.padEnd(32, '0').slice(0, 32);
  return Buffer.from(padded, 'utf8');
}

export function deriveWingIV(clientId: string): Buffer {
  // Formula: IV = clientID.slice(0, 12)
  const sliced = clientId.slice(0, 12);
  return Buffer.from(sliced, 'utf8');
}

export function encryptAES256GCM(
  plainText: string,
  key: Buffer,
  iv: Buffer,
): string {
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag(); // 16-byte authentication tag
  const combined = Buffer.concat([encrypted, tag]);
  return combined.toString('base64');
}

export function decryptAES256GCM(
  base64CipherText: string,
  key: Buffer,
  iv: Buffer,
): string {
  const dataBuffer = Buffer.from(base64CipherText, 'base64');
  // Authentication tag is always the last 16 bytes in GCM mode when concatenated
  const ciphertext = dataBuffer.subarray(0, dataBuffer.length - 16);
  const tag = dataBuffer.subarray(dataBuffer.length - 16);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function generatePayloadHash(
  clientId: string,
  amount: string,
  currency: string,
  orderReferenceNo: string,
  returnUrl: string,
  cancelUrl: string,
  timestamp: string,
  key: Buffer,
  iv: Buffer,
): string {
  // Step 1: Concatenate parameters using # separator
  const rawStr = `${clientId}#${amount}#${currency}#${orderReferenceNo}#${returnUrl}#${cancelUrl}#${timestamp}`;
  // Step 2: Base64 encode the concatenated string
  const b64Str = Buffer.from(rawStr, 'utf8').toString('base64');
  // Step 3 & 4: Encrypt the Base64 string with AES-256-GCM and Base64 encode the result
  const aesB64 = encryptAES256GCM(b64Str, key, iv);
  // Step 5: Sha256 hash the final Base64 string to hex
  return crypto.createHash('sha256').update(aesB64).digest('hex');
}
