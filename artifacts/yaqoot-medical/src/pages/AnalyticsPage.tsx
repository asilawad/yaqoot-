import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Users, Calendar, Clock, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useData } from "@/contexts/DataContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AnalyticsPage() {
  const { t, isRTL, locale } = useTranslation();
  const [, setLocation] = useLocation();
  const { patients, visits } = useData();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const totalPatients = patients.length;
  const totalVisits = visits.length;
  const monthVisits = visits.filter(v => v.visitDate >= startOfMonth).length;
  const pendingPayments = visits.filter(v => v.paymentStatus === "unpaid").length;

  const serviceKeys = [
    { key: "service.internal", label_en: "Internal Medicine", label_ar: "الباطنة", values: ["Internal Medicine", "استشارات الباطنة"] },
    { key: "service.surgery", label_en: "Surgery", label_ar: "الجراحة", values: ["Surgery", "الجراحة"] },
    { key: "service.pt", label_en: "Physical Therapy", label_ar: "العلاج الطبيعي", values: ["Physical Therapy", "العلاج الطبيعي"] },
    { key: "service.obgyn", label_en: "OB/GYN", label_ar: "النساء", values: ["OB/GYN", "النساء"] },
    { key: "service.nutrition", label_en: "Nutrition", label_ar: "التغذية", values: ["Clinical Nutrition", "التغذية"] },
    { key: "service.nephrology", label_en: "Nephrology", label_ar: "الكلى", values: ["Nephrology", "الكلى"] },
    { key: "service.nursing", label_en: "Nursing", label_ar: "التمريض", values: ["Nursing", "التمريض"] },
  ];

  const chartData = serviceKeys
    .map(({ key, label_en, label_ar, values }) => ({
      name: locale === "ar" ? label_ar : label_en,
      count: visits.filter(v => v.mainService && values.some(val => v.mainService?.includes(val))).length,
    }))
    .sort((a, b) => b.count - a.count);

  const kpis = [
    { key: "analytics.totalPatients", value: totalPatients, icon: Users, color: "#50C878" },
    { key: "analytics.totalVisits", value: totalVisits, icon: Calendar, color: "#3b82f6" },
    { key: "analytics.monthVisits", value: monthVisits, icon: Clock, color: "#f59e0b" },
    { key: "analytics.pendingPayments", value: pendingPayments, icon: AlertCircle, color: "#ef4444" },
  ];

  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => setLocation("/settings")}
        data-testid="btn-back-analytics"
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#717182", fontSize: 14, cursor: "pointer", marginBottom: 24, fontFamily: "'Cairo', sans-serif", flexDirection: "row" }}
      >
        <Arrow size={16} />
        {t("common.back")}
      </button>

      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#171717", marginBottom: 24, textAlign: "start" }}>{t("settings.analytics")}</h1>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {kpis.map(({ key, value, icon: Icon, color }) => (
          <div key={key} className="medical-card" style={{ textAlign: "start" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexDirection: "row", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "#717182", fontWeight: 500 }}>{t(key)}</span>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={18} strokeWidth={1.5} color={color} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#171717" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="medical-card">
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#171717", marginBottom: 20, textAlign: "start" }}>{t("analytics.serviceDemand")}</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F1F1" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#717182", fontFamily: "Cairo" }} />
            <YAxis tick={{ fontSize: 12, fill: "#717182" }} allowDecimals={false} />
            <Tooltip contentStyle={{ fontFamily: "Cairo", borderRadius: 8, border: "1px solid #F1F1F1" }} />
            <Bar dataKey="count" fill="#50C878" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
