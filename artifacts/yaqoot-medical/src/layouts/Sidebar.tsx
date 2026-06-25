import { useLocation, Link } from "wouter";
import { Users, Settings } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import logoSrc from "@assets/yaqoot_logo_nobg.png";

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
        width: 240,
        minWidth: 240,
        backgroundColor: "#ffffff",
        borderRight: isRTL ? "none" : "1px solid #F1F1F1",
        borderLeft: isRTL ? "1px solid #F1F1F1" : "none",
        padding: "20px 12px",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 mb-8"
        style={{ flexDirection: isRTL ? "row-reverse" : "row" }}
      >
        <img
          src={logoSrc}
          alt="Yaqoot Logo"
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            objectFit: "contain",
            flexShrink: 0,
            background: "#F9FAFB",
            padding: 2,
          }}
        />
        <div style={{ textAlign: isRTL ? "right" : "left" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#171717",
              lineHeight: 1.3,
            }}
          >
            {t("sidebar.clinicName")}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#717182",
              lineHeight: 1.4,
              marginTop: 2,
            }}
          >
            {t("sidebar.slogan")}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderBottom: "1px solid #F1F1F1", marginBottom: 16 }} />

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ key, href, icon: Icon }) => (
          <Link key={key} href={href}>
            <div
              className={`sidebar-nav-item ${isActive(href) ? "active" : ""}`}
              style={{ flexDirection: isRTL ? "row-reverse" : "row", textAlign: isRTL ? "right" : "left" }}
              data-testid={`nav-${key}`}
            >
              <Icon size={18} strokeWidth={1.5} />
              <span>{t(key)}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* Language Toggle */}
      <div style={{ borderTop: "1px solid #F1F1F1", paddingTop: 12, marginTop: 8 }}>
        <button
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          data-testid="btn-toggle-language"
          style={{
            width: "100%",
            padding: "8px 14px",
            borderRadius: 10,
            border: "1px solid #F1F1F1",
            background: "#F9FAFB",
            color: "#717182",
            fontSize: 13,
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
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#F9FAFB";
            (e.currentTarget as HTMLButtonElement).style.color = "#717182";
          }}
        >
          {t("sidebar.toggleLang")}
        </button>
      </div>
    </div>
  );
}
