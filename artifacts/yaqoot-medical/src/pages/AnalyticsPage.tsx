import { useLocation } from "wouter";
import { Users, Calendar, Clock, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useData } from "@/contexts/DataContext";
import NavigationBackButton from "@/components/NavigationBackButton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SERVICES, matchesServiceFilter } from "@/lib/services";

export default function AnalyticsPage() {
  const { t, isRTL } = useTranslation();
  const [, setLocation] = useLocation();
  const { patients, visits, isLoading, error } = useData();
  if (isLoading) return <div style={{ padding: 48, textAlign: "center" }}>{t("analytics.loading")}</div>;
  if (error) return <div style={{ padding: 48, textAlign: "center", color: "#b91c1c" }}>{error}</div>;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const totalPatients = patients.length;
  const totalVisits = visits.length;
  const monthVisits = visits.filter(v => v.visitDate >= startOfMonth).length;
  const pendingPayments = visits.filter(v => v.paymentStatus === "unpaid").length;

  const otherService = SERVICES.find(service => service.value === "Other");
  const visitCounts = new Map<string, number>(SERVICES.map(service => [service.value, 0] as const));
  for (const visit of visits) {
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
