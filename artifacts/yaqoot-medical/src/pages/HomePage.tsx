import logoSrc from "@assets/yaqoot logo 1.png";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function HomePage() {
  const { t, locale, isRTL } = useTranslation();
  const formattedDate = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #F1F1F1",
    borderInlineStart: "4px solid #50C878",
    borderRadius: 16,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    padding: "24px 26px",
    textAlign: "start",
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        minHeight: "calc(100vh - 48px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 0",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 920,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <img
          src={logoSrc}
          alt={t("sidebar.clinicName")}
          style={{
            width: 200,
            height: 200,
            objectFit: "contain",
            marginBottom: 10,
          }}
        />

        <h1
          style={{
            margin: 0,
            color: "#171717",
            fontSize: 28,
            fontWeight: 800,
            lineHeight: 1.35,
          }}
        >
          {t("sidebar.clinicName")}
        </h1>

        <p
          style={{
            margin: "8px 0 34px",
            color: "#717182",
            fontSize: 15,
            lineHeight: 1.7,
          }}
        >
          {t("home.welcome", { date: formattedDate })}
        </p>

        <div
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
            textAlign: "start",
          }}
        >
          <section style={cardStyle}>
            <h2
              style={{
                margin: "0 0 10px",
                color: "#50C878",
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              {t("home.visionTitle")}
            </h2>
            <p style={{ margin: 0, color: "#4B5563", fontSize: 14, lineHeight: 1.9 }}>
              {t("home.visionText")}
            </p>
          </section>

          <section style={cardStyle}>
            <h2
              style={{
                margin: "0 0 10px",
                color: "#50C878",
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              {t("home.missionTitle")}
            </h2>
            <p style={{ margin: 0, color: "#4B5563", fontSize: 14, lineHeight: 1.9 }}>
              {t("home.missionText")}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}