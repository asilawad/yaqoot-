import CryptoJS from "crypto-js";

export class DecryptionError extends Error {
  constructor(message = "Invalid passphrase or corrupted file") {
    super(message);
    this.name = "DecryptionError";
  }
}

export function encryptString(plain: string, passphrase: string): string {
  return CryptoJS.AES.encrypt(plain, passphrase).toString();
}

export function decryptString(cipher: string, passphrase: string): string {
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