import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { exportEncryptedBackup } from "@/lib/db/secureBackup";

type ExitGuardModalProps = {
  open: boolean;
  onCancel: () => void;
  onExit: () => Promise<void>;
};

const MIN_PASSPHRASE_LENGTH = 8;

async function saveEncryptedBackupFile(contents: string, filename: string): Promise<boolean> {
  const [{ save }, { writeTextFile }] = await Promise.all([
    import("@tauri-apps/plugin-dialog"),
    import("@tauri-apps/plugin-fs"),
  ]);
  const filePath = await save({
    defaultPath: filename,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (!filePath) return false;
  await writeTextFile(filePath, contents);
  return true;
}

export default function ExitGuardModal({
  open,
  onCancel,
  onExit,
}: ExitGuardModalProps) {
  const { t, isRTL } = useTranslation();
  const { toast } = useToast();
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [passphraseError, setPassphraseError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!open) return null;

  const closePassphrase = () => {
    if (isSaving) return;
    setShowPassphrase(false);
    setPassphrase("");
    setPassphraseError("");
  };

  const handleBackupAndExit = async () => {
    if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
      setPassphraseError(t("data.backup.passphraseMin"));
      return;
    }
    setIsSaving(true);
    setPassphraseError("");
    try {
      const contents = await exportEncryptedBackup(passphrase);
      const saved = await saveEncryptedBackupFile(
        contents,
        `yaqoot_backup_${new Date().toISOString().slice(0, 10)}.json`,
      );
      if (!saved) return;
      await onExit();
    } catch (error) {
      console.error("Exit backup failed:", error);
      toast({ title: t("data.backupError"), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          direction: isRTL ? "rtl" : "ltr",
        }}
      >
        <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 460, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
          <AlertTriangle size={32} color="#f59e0b" style={{ margin: "0 auto 14px" }} />
          <h2 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 10px", color: "#171717" }}>{t("exitGuard.title")}</h2>
          <p style={{ fontSize: 14, color: "#717182", lineHeight: 1.6, margin: "0 0 24px" }}>{t("exitGuard.description")}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button type="button" data-testid="btn-exit-backup" onClick={() => setShowPassphrase(true)} style={{ padding: "11px 16px", borderRadius: 9, border: "none", background: "#50C878", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
              {t("exitGuard.backupAndExit")}
            </button>
            <button type="button" data-testid="btn-exit-without-backup" onClick={onExit} style={{ padding: "11px 16px", borderRadius: 9, border: "1px solid #FCA5A5", background: "#FFF5F5", color: "#B91C1C", fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
              {t("exitGuard.exitWithoutBackup")}
            </button>
            <button type="button" data-testid="btn-exit-cancel" onClick={onCancel} style={{ padding: "11px 16px", borderRadius: 9, border: "1px solid #DDE5DF", background: "#fff", color: "#717182", fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
              {t("common.cancel")}
            </button>
          </div>
        </div>
      </div>

      {showPassphrase && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10001, direction: isRTL ? "rtl" : "ltr" }}
        >
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 420, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: "#171717" }}>{t("data.backup.passphraseTitle")}</h2>
            <p style={{ fontSize: 13, color: "#717182", lineHeight: 1.6, margin: "0 0 16px" }}>{t("data.backup.passphraseDescription")}</p>
            <input
              autoFocus
              type="password"
              value={passphrase}
              onChange={event => { setPassphrase(event.target.value); setPassphraseError(""); }}
              data-testid="input-exit-passphrase"
              placeholder={t("data.backup.passphrasePlaceholder")}
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #DDE5DF", borderRadius: 8, fontFamily: "'Cairo', sans-serif" }}
            />
            {passphraseError && <div style={{ color: "#B91C1C", fontSize: 12, marginTop: 7 }}>{passphraseError}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button type="button" onClick={closePassphrase} disabled={isSaving} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #DDE5DF", background: "#fff", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{t("common.cancel")}</button>
              <button type="button" onClick={handleBackupAndExit} disabled={isSaving} data-testid="btn-confirm-exit-backup" style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: "#50C878", color: "#fff", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{t("data.backup.saveEncrypted")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}