import * as repo from "./repository";
import { decryptString, DecryptionError, encryptString, EncryptedBackupV2 } from "@/lib/security/crypto";

export { DecryptionError };

export async function exportEncryptedBackup(passphrase: string): Promise<string> {
  const plainJson = await repo.exportData();
  const envelope = await encryptString(plainJson, passphrase);
  return JSON.stringify(envelope);
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
    let plain: string;
    if ("version" in parsed && parsed.version === 2) {
      plain = await decryptString(parsed as EncryptedBackupV2, passphrase);
    } else if (!("version" in parsed) || parsed.version === 1) {
      plain = await decryptString(parsed.payload, passphrase);
    } else {
      throw new DecryptionError();
    }
    await repo.importData(plain);
    return;
  }

  await repo.importData(fileContents);
}