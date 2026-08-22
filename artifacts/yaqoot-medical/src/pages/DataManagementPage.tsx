import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Download, Upload, HardDrive, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
import NavigationBackButton from "@/components/NavigationBackButton";
import * as repo from "@/lib/db/repository";

function getStorageSize(): string {
  let total = 0;
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("yaqoot_")) {
      total += (localStorage.getItem(key) || "").length * 2;
    }
  }
  if (total < 1024) return `${total} B`;
  if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
  return `${(total / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DataManagementPage() {
  const { t, isRTL } = useTranslation();
  const [, setLocation] = useLocation();
  const { importData, refreshData } = useData();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const [storageSize] = useState(getStorageSize());

  const handleBackup = () => {
    const data = repo.exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `yaqoot_backup_${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t("common.save") + " ✓" });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPendingFile(ev.target?.result as string);
      setShowRestoreConfirm(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleRestoreConfirm = () => {
    if (!pendingFile) return;
    try {
      importData(pendingFile);
      refreshData();
      toast({ title: t("data.restoreSuccess") });
    } catch {
      toast({ title: "Error restoring data", variant: "destructive" });
    }
    setShowRestoreConfirm(false);
    setPendingFile(null);
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #F1F1F1",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    padding: 24,
    textAlign: "start",
  };

  return (
    <div>
      <NavigationBackButton to="/settings" testId="btn-back-data" />

      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#171717", marginBottom: 24, textAlign: "start" }}>{t("data.title")}</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Backup */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexDirection: "row" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Download size={20} strokeWidth={1.5} color="#50C878" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#171717" }}>{t("data.backup")}</div>
              <div style={{ fontSize: 13, color: "#717182" }}>Export all data as JSON</div>
            </div>
          </div>
          <button
            onClick={handleBackup}
            data-testid="btn-backup"
            style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#50C878", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
          >
            {t("data.backupBtn")}
          </button>
        </div>

        {/* Restore */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexDirection: "row" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#FFF3E0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Upload size={20} strokeWidth={1.5} color="#f59e0b" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#171717" }}>{t("data.restore")}</div>
              <div style={{ fontSize: 13, color: "#717182" }}>Import from backup JSON file</div>
            </div>
          </div>
          <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleFileSelect} />
          <button
            onClick={() => fileRef.current?.click()}
            data-testid="btn-restore"
            style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #f59e0b", background: "#FFF3E0", color: "#f59e0b", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
          >
            {t("data.restoreBtn")}
          </button>
        </div>

        {/* Storage info */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexDirection: "row" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <HardDrive size={20} strokeWidth={1.5} color="#6366f1" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#171717" }}>{t("data.storage")}</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#171717" }}>{storageSize}</div>
          <div style={{ fontSize: 13, color: "#717182", marginTop: 4 }}>localStorage (browser)</div>
        </div>
      </div>

      {/* Restore Confirmation Dialog */}
      {showRestoreConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 440, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", direction: isRTL ? "rtl" : "ltr" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FFF3E0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <AlertTriangle size={28} color="#f59e0b" strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#171717", marginBottom: 12 }}>{t("data.restore")}</div>
            <div style={{ fontSize: 14, color: "#717182", marginBottom: 24, lineHeight: 1.6 }}>{t("data.restoreConfirm")}</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => { setShowRestoreConfirm(false); setPendingFile(null); }}
                style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid #F1F1F1", background: "#F9FAFB", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleRestoreConfirm}
                data-testid="btn-confirm-restore"
                style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#f59e0b", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
              >
                {t("common.yes")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
