import CryptoJS from "crypto-js";

export class DecryptionError extends Error {
  constructor(message = "Invalid passphrase or corrupted file") {
    super(message);
    this.name = "DecryptionError";
  }
}

export interface EncryptedBackupV2 {
  version: 2;
  encrypted: true;
  kdf: "PBKDF2-SHA256";
  iterations: 600000;
  salt: string;
  iv: string;
  payload: string;
}

function getSubtle(): SubtleCrypto {
  if (!globalThis.crypto?.subtle) {
    throw new Error("WebCrypto is unavailable; secure backup encryption requires crypto.subtle.");
  }
  return globalThis.crypto.subtle;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), char => char.charCodeAt(0));
}

async function deriveKey(subtle: SubtleCrypto, passphrase: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const material = await subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 600000 },
    material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"],
  );
}

export async function encryptString(plain: string, passphrase: string): Promise<EncryptedBackupV2> {
  const subtle = getSubtle();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(subtle, passphrase, salt);
  const ciphertext = await subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain));
  return {
    version: 2, encrypted: true, kdf: "PBKDF2-SHA256", iterations: 600000,
    salt: toBase64(salt), iv: toBase64(iv), payload: toBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptString(cipher: string | EncryptedBackupV2, passphrase: string): Promise<string> {
  if (typeof cipher !== "string") {
    const subtle = getSubtle();
    try {
      if (cipher.version !== 2 || cipher.encrypted !== true || cipher.kdf !== "PBKDF2-SHA256" ||
          cipher.iterations !== 600000 || typeof cipher.salt !== "string" ||
          typeof cipher.iv !== "string" || typeof cipher.payload !== "string") throw new DecryptionError();
      const salt = fromBase64(cipher.salt);
      const iv = fromBase64(cipher.iv);
      const payload = fromBase64(cipher.payload);
      if (salt.length !== 16 || iv.length !== 12 || payload.length < 16) throw new DecryptionError();
      const key = await deriveKey(subtle, passphrase, salt);
      const plaintext = await subtle.decrypt({ name: "AES-GCM", iv }, key, payload);
      const plain = new TextDecoder("utf-8", { fatal: true }).decode(plaintext);
      if (!plain.trim()) throw new Error("Empty plaintext");
      JSON.parse(plain);
      return plain;
    } catch {
      throw new DecryptionError();
    }
  }
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, passphrase);
    const plain = bytes.toString(CryptoJS.enc.Utf8);
    if (!plain.trim()) throw new Error("Empty plaintext");
    JSON.parse(plain);
    return plain;
  } catch {
    throw new DecryptionError();
  }
}