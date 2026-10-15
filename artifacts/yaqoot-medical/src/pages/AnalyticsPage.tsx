import { useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { Users, Calendar, Clock, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useData } from "@/contexts/DataContext";
import NavigationBackButton from "@/components/NavigationBackButton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { SERVICES, matchesServiceFilter } from "@/lib/services";
import { formatDate } from "@/lib/date";

const filterSelectStyle: CSSProperties = { border: "1px solid #E5E7EB", borderRadius: 10, padding: "7px 10px", fontSize: 14, fontFamily: "'Cairo', sans-serif", background: "#F9FAFB", color: "#171717" };
const showAllBtnStyle: CSSProperties = { background: "none", border: "none", color: "#50C878", fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "'Cairo', sans-serif" };

export default function AnalyticsPage() {
  const { t, isRTL } = useTranslation();
  const [, setLocation] = useLocation();
  const { patients, visits, isLoading, error } = useData();
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  if (isLoading) return <div style={{ padding: 48, textAlign: "center" }}>{t("analytics.loading")}</div>;
  if (error) return <div style={{ padding: 48, textAlign: "center", color: "#b91c1c" }}>{error}</div>;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const totalPatients = patients.length;
  const totalVisits = visits.length;
  const monthVisits = visits.filter(v => v.visitDate >= startOfMonth).length;
  const pendingPayments = visits.filter(v => v.paymentStatus === "unpaid").length;
  const years = Array.from(new Set([
    ...visits.map(v => formatDate(v.visitDate).slice(0, 4)).filter(y => /^\d{4}$/.test(y)),
    ...(year ? [year] : []),
  ])).sort((a, b) => b.localeCompare(a));
  const periodVisits = year
    ? visits.filter(v => {
        const d = formatDate(v.visitDate);
        return d.slice(0, 4) === year && (!month || Number(d.slice(5, 7)) === Number(month));
      })
    : visits;
  const periodLabel = year ? (month ? `${t(`analytics.month.${Number(month)}`)} ${year}` : year) : "";

  const otherService = SERVICES.find(service => service.value === "Other");
  const visitCounts = new Map<string, number>(SERVICES.map(service => [service.value, 0] as const));
  for (const visit of periodVisits) {
    const matchedService = SERVICES.find(service =>
      service.value !== "Other" && matchesServiceFilter(visit.mainService, visit.subService, service.value, ""),
    );
    const service = matchedService ?? (visit.mainService?.trim() ? otherService : undefined);
    if (service) visitCounts.set(service.value, (visitCounts.get(service.value) ?? 0) + 1);
  }
  const chartData = SERVICES.map(service => ({
    name: t(service.labelKey),
    count: visitCounts.get(service.value) ?? 0,
  }));

  const kpis = [
    { key: "analytics.totalPatients", value: totalPatients, icon: Users, color: "#50C878" },
    { key: "analytics.totalVisits", value: totalVisits, icon: Calendar, color: "#3b82f6" },
    { key: "analytics.monthVisits", value: monthVisits, icon: Clock, color: "#f59e0b" },
    { key: "analytics.pendingPayments", value: pendingPayments, icon: AlertCircle, color: "#ef4444" },
  ];

  return (
    <div>
      {/* Back button */}
      <NavigationBackButton to="/settings" testId="btn-back-analytics" />

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
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div style={{ textAlign: "start" }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#171717", margin: 0 }}>
              {t("analytics.serviceDemand")}{periodLabel ? ` — ${periodLabel}` : ""}
            </h2>
            {year && (
              <div data-testid="text-period-visits" style={{ fontSize: 13, color: "#717182", marginTop: 4 }}>
                {t("analytics.periodVisits", { count: periodVisits.length })}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <select data-testid="select-analytics-year" aria-label={t("analytics.filterYear")} value={year}
              onChange={e => { setYear(e.target.value); setMonth(""); }} style={filterSelectStyle}>
              <option value="">{t("analytics.allYears")}</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select data-testid="select-analytics-month" aria-label={t("analytics.filterMonth")} value={month} disabled={!year}
              onChange={e => setMonth(e.target.value)}
              style={{ ...filterSelectStyle, opacity: year ? 1 : 0.5, cursor: year ? "pointer" : "not-allowed" }}>
              <option value="">{t("analytics.allMonths")}</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{t(`analytics.month.${m}`)}</option>
              ))}
            </select>
            {year && (
              <button type="button" data-testid="btn-analytics-show-all" style={showAllBtnStyle}
                onClick={() => { setYear(""); setMonth(""); }}>
                {t("analytics.showAll")}
              </button>
            )}
          </div>
        </div>
        {year && periodVisits.length === 0 ? (
          <div data-testid="text-analytics-empty" style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "#717182", fontSize: 14 }}>
            {t("analytics.noVisitsPeriod")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 20, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F1F1" />
              <XAxis dataKey="name" interval={0} tick={{ fontSize: 12, fill: "#717182", fontFamily: "Cairo" }} />
              <YAxis tick={{ fontSize: 12, fill: "#717182" }} allowDecimals={false} />
              <Tooltip cursor={{ fill: "rgba(80,200,120,0.08)" }} contentStyle={{ fontFamily: "Cairo", borderRadius: 8, border: "1px solid #F1F1F1" }} />
              <Bar dataKey="count" name={t("analytics.visitsLabel")} fill="#50C878" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="count" position="top"
                  formatter={(v: unknown) => (typeof v === "number" && v > 0 ? v : "")}
                  style={{ fontSize: 12, fill: "#171717", fontFamily: "Cairo" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
