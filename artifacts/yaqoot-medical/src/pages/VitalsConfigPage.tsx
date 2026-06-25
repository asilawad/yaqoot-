import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useData } from "@/contexts/DataContext";
import { defaultVitalSettings } from "@/lib/db/vitalDefaults";
import { VitalThreshold } from "@/lib/db/types";
import { useToast } from "@/hooks/use-toast";

export default function VitalsConfigPage() {
  const { t, isRTL } = useTranslation();
  const [, setLocation] = useLocation();
  const { vitalSettings, saveVitalSettings } = useData();
  const { toast } = useToast();
  const [settings, setSettings] = useState<VitalThreshold[]>(
    vitalSettings.length > 0 ? vitalSettings : defaultVitalSettings
  );

  const update = (id: string, field: keyof VitalThreshold, value: string | number) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSave = () => {
    saveVitalSettings(settings);
    toast({ title: t("vitalsConfig.success") });
  };

  const handleReset = () => {
    setSettings(defaultVitalSettings);
    saveVitalSettings(defaultVitalSettings);
    toast({ title: t("vitalsConfig.success") });
  };

  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const inputStyle: React.CSSProperties = {
    background: "#F3F3F5",
    border: "1px solid #F1F1F1",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 13,
    fontFamily: "'Cairo', sans-serif",
    width: "100%",
    color: "#171717",
    outline: "none",
  };

  return (
    <div>
      <button
        onClick={() => setLocation("/settings")}
        data-testid="btn-back-vitals-config"
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#717182", fontSize: 14, cursor: "pointer", marginBottom: 24, fontFamily: "'Cairo', sans-serif", flexDirection: isRTL ? "row-reverse" : "row" }}
      >
        <Arrow size={16} />
        {t("common.back")}
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexDirection: isRTL ? "row-reverse" : "row" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#171717" }}>{t("vitalsConfig.title")}</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleReset}
            data-testid="btn-reset-vitals"
            style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #F1F1F1", background: "#F9FAFB", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif", color: "#717182" }}
          >
            {t("vitalsConfig.reset")}
          </button>
          <button
            onClick={handleSave}
            data-testid="btn-save-vitals"
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#50C878", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
          >
            {t("vitalsConfig.save")}
          </button>
        </div>
      </div>

      <div className="medical-card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", direction: isRTL ? "rtl" : "ltr" }}>
          <thead>
            <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #F1F1F1" }}>
              {[t("vitalsConfig.name"), t("vitalsConfig.unit"), t("vitalsConfig.min"), t("vitalsConfig.max"), t("vitalsConfig.highLabel"), t("vitalsConfig.lowLabel")].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: isRTL ? "right" : "left", fontSize: 12, fontWeight: 600, color: "#717182", fontFamily: "'Cairo', sans-serif" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {settings.map((s, idx) => (
              <tr key={s.id} style={{ background: idx % 2 === 0 ? "#fff" : "#E8F5E9", borderBottom: "1px solid #F1F1F1" }}>
                <td style={{ padding: "10px 16px", fontSize: 14, fontWeight: 600, color: "#171717", fontFamily: "'Cairo', sans-serif" }}>{t(s.name)}</td>
                <td style={{ padding: "10px 16px" }}>
                  <input style={inputStyle} value={s.unit} onChange={e => update(s.id, "unit", e.target.value)} />
                </td>
                <td style={{ padding: "10px 16px" }}>
                  <input type="number" style={inputStyle} value={s.minNormal} onChange={e => update(s.id, "minNormal", parseFloat(e.target.value) || 0)} />
                </td>
                <td style={{ padding: "10px 16px" }}>
                  <input type="number" style={inputStyle} value={s.maxNormal} onChange={e => update(s.id, "maxNormal", parseFloat(e.target.value) || 0)} />
                </td>
                <td style={{ padding: "10px 16px" }}>
                  <span style={{ fontSize: 13, color: "#ef4444", fontWeight: 500 }}>{t(s.highLabel)}</span>
                </td>
                <td style={{ padding: "10px 16px" }}>
                  <span style={{ fontSize: 13, color: "#3b82f6", fontWeight: 500 }}>{t(s.lowLabel)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
