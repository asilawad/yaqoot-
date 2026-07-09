import { useLocation } from "wouter";
import { BarChart2, Activity, Database, Info } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

const cards = [
  { key: "settings.analytics", href: "/settings/analytics", icon: BarChart2, desc_ar: "إحصائيات وتقارير العيادة", desc_en: "Clinic statistics and reports" },
  { key: "settings.vitals", href: "/settings/vitals", icon: Activity, desc_ar: "تهيئة قيم المؤشرات الحيوية", desc_en: "Configure vital sign thresholds" },
  { key: "settings.data", href: "/settings/data", icon: Database, desc_ar: "نسخ احتياطي واستعادة البيانات", desc_en: "Backup and restore data" },
  { key: "settings.system", href: "/settings/system", icon: Info, desc_ar: "معلومات الإصدار والتخزين", desc_en: "Version and storage info" },
];

export default function SettingsPage() {
  const { t, locale } = useTranslation();
  const [, setLocation] = useLocation();

  return (
    <div>
      <div style={{ marginBottom: 32, textAlign: "start" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#171717" }}>{t("settings.title")}</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
        {cards.map(({ key, href, icon: Icon, desc_ar, desc_en }) => (
          <button
            key={key}
            onClick={() => setLocation(href)}
            data-testid={`card-setting-${key}`}
            style={{
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid #F1F1F1",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              padding: 28,
              cursor: "pointer",
              textAlign: "start",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              transition: "all 0.15s ease",
              fontFamily: "'Cairo', sans-serif",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.boxShadow = "0 8px 24px rgba(80,200,120,0.15)";
              el.style.borderColor = "#50C878";
              el.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
              el.style.borderColor = "#F1F1F1";
              el.style.transform = "translateY(0)";
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "flex-start" }}>
              <Icon size={24} strokeWidth={1.5} color="#50C878" />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#171717", marginBottom: 4 }}>{t(key)}</div>
              <div style={{ fontSize: 13, color: "#717182" }}>{locale === "ar" ? desc_ar : desc_en}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
