import { useLocation, Link } from "wouter";
import { Users, Settings } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function Sidebar() {
  const { t, locale, setLocale, isRTL } = useTranslation();
  const [location] = useLocation();

  const navItems = [
    { key: "sidebar.patients", href: "/", icon: Users },
    { key: "sidebar.settings", href: "/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: 256,
        minWidth: 256,
        backgroundColor: "#ffffff",
        borderRight: isRTL ? "none" : "1px solid #F1F1F1",
        borderLeft: isRTL ? "1px solid #F1F1F1" : "none",
        padding: "28px 16px",
      }}
    >
      {/* Clinic Identity — no logo, name is the hero */}
      <div style={{ marginBottom: 32, textAlign: isRTL ? "right" : "left", paddingInline: 6 }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: "#171717",
            lineHeight: 1.35,
            letterSpacing: "-0.2px",
          }}
        >
          {t("sidebar.clinicName")}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#717182",
            lineHeight: 1.5,
            marginTop: 5,
            fontWeight: 400,
          }}
        >
          {t("sidebar.slogan")}
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderBottom: "1px solid #F1F1F1", marginBottom: 20 }} />

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ key, href, icon: Icon }) => (
          <Link key={key} href={href}>
            <div
              className={`sidebar-nav-item ${isActive(href) ? "active" : ""}`}
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                textAlign: isRTL ? "right" : "left",
                fontSize: 15,
                padding: "11px 14px",
                gap: 12,
              }}
              data-testid={`nav-${key}`}
            >
              <Icon size={19} strokeWidth={1.6} />
              <span>{t(key)}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* Language Toggle */}
      <div style={{ borderTop: "1px solid #F1F1F1", paddingTop: 14, marginTop: 8 }}>
        <button
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          data-testid="btn-toggle-language"
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #F1F1F1",
            background: "#F9FAFB",
            color: "#717182",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontFamily: "'Cairo', sans-serif",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#E8F5E9";
            (e.currentTarget as HTMLButtonElement).style.color = "#50C878";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#50C878";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#F9FAFB";
            (e.currentTarget as HTMLButtonElement).style.color = "#717182";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#F1F1F1";
          }}
        >
          {t("sidebar.toggleLang")}
        </button>
      </div>
    </div>
  );
}
