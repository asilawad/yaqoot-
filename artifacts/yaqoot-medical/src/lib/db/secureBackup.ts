import * as repo from "./repository";
import { decryptString, DecryptionError, encryptString } from "@/lib/security/crypto";

export { DecryptionError };

export async function exportEncryptedBackup(passphrase: string): Promise<string> {
  const plainJson = await repo.exportData();
  const payload = encryptString(plainJson, passphrase);
  return JSON.stringify({ version: 1, encrypted: true, payload });
}

export async function importEncryptedBackup(
  fileContents: string,
  passphrase?: string,
): Promise<void> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fileContents);
  } catch {
    await repo.importData(fileContents);
    return;
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    "encrypted" in parsed &&
    parsed.encrypted === true
  ) {
    if (!passphrase) throw new DecryptionError();
    if (!("payload" in parsed) || typeof parsed.payload !== "string") {
      throw new DecryptionError();
    }
    await repo.importData(decryptString(parsed.payload, passphrase));
    return;
  }

  await repo.importData(fileContents);
}