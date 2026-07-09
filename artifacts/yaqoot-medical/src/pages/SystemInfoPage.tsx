import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Tag, HardDrive, CheckCircle, RefreshCw } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useToast } from "@/hooks/use-toast";

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

export default function SystemInfoPage() {
  const { t, isRTL } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const rows = [
    { icon: Tag, color: "#50C878", bg: "#E8F5E9", label: t("system.version"), value: "v1.0.0" },
    { icon: HardDrive, color: "#6366f1", bg: "#EEF2FF", label: t("system.storagePath"), value: "localStorage (browser)" },
    { icon: CheckCircle, color: "#50C878", bg: "#E8F5E9", label: t("system.status"), value: t("system.operational") },
    { icon: HardDrive, color: "#3b82f6", bg: "#EFF6FF", label: t("system.totalStorage"), value: getStorageSize() },
  ];

  return (
    <div>
      <button
        onClick={() => setLocation("/settings")}
        data-testid="btn-back-system"
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#717182", fontSize: 14, cursor: "pointer", marginBottom: 24, fontFamily: "'Cairo', sans-serif", flexDirection: "row" }}
      >
        <Arrow size={16} />
        {t("common.back")}
      </button>

      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#171717", marginBottom: 24, textAlign: "start" }}>{t("system.title")}</h1>

      <div className="medical-card" style={{ padding: 0, overflow: "hidden" }}>
        {rows.map(({ icon: Icon, color, bg, label, value }, idx) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "18px 24px",
              borderBottom: idx < rows.length - 1 ? "1px solid #F1F1F1" : "none",
              flexDirection: "row",
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={18} strokeWidth={1.5} color={color} />
            </div>
            <div style={{ flex: 1, textAlign: "start" }}>
              <div style={{ fontSize: 12, color: "#717182", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#171717" }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, textAlign: "start" }}>
        <button
          onClick={() => toast({ title: t("system.upToDate") })}
          data-testid="btn-check-updates"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, border: "1px solid #F1F1F1", background: "#F9FAFB", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif", color: "#717182", flexDirection: "row" }}
        >
          <RefreshCw size={16} strokeWidth={1.5} />
          {t("system.checkUpdates")}
        </button>
      </div>
    </div>
  );
}
