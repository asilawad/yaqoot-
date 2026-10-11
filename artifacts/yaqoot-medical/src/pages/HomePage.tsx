import logoSrc from "@assets/yaqoot logo 1.png";
import { Pencil, Compass, HeartHandshake } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { clearHomeText, getHomeText, HOME_TEXT_MAX_LENGTH, HomeTextKind, setHomeText } from "@/lib/homeContent";

export default function HomePage() {
  const { t, locale, isRTL } = useTranslation();
  const { toast } = useToast();
  const [savedVision, setSavedVision] = useState<string | null>(() => getHomeText("vision", locale));
  const [savedMission, setSavedMission] = useState<string | null>(() => getHomeText("mission", locale));
  const [editingKind, setEditingKind] = useState<HomeTextKind | null>(null);
  const [draft, setDraft] = useState("");
  const visionText = savedVision ?? t("home.visionText");
  const missionText = savedMission ?? t("home.missionText");
  const editingText = editingKind === "vision" ? visionText : editingKind === "mission" ? missionText : "";

  useEffect(() => {
    setSavedVision(getHomeText("vision", locale));
    setSavedMission(getHomeText("mission", locale));
  }, [locale]);

  useEffect(() => {
    if (!editingKind) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEditingKind(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingKind]);

  const openEditor = (kind: HomeTextKind, currentText: string) => {
    setDraft(currentText);
    setEditingKind(kind);
  };

  const saveHomeText = () => {
    if (!editingKind) return;
    if (!setHomeText(editingKind, locale, draft)) {
      toast({ title: t("home.editError"), variant: "destructive" });
      return;
    }
    const trimmed = draft.trim();
    if (editingKind === "vision") setSavedVision(trimmed || null);
    else setSavedMission(trimmed || null);
    setEditingKind(null);
    toast({ title: t("home.editSaved") });
  };

  const restoreDefault = () => {
    if (!editingKind) return;
    if (!clearHomeText(editingKind, locale)) {
      toast({ title: t("home.editError"), variant: "destructive" });
      return;
    }
    if (editingKind === "vision") setSavedVision(null);
    else setSavedMission(null);
    setEditingKind(null);
    toast({ title: t("home.editSaved") });
  };

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
    padding: "30px 30px",
    textAlign: "start",
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        minHeight: "calc(100vh - 48px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "0 0 20px",
        marginTop: -24,
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
            width: 216,
            height: 216,
            objectFit: "contain",
            marginBottom: 0,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2.5rem" }}>
          <h1
            style={{
              margin: "-3rem 0 0",
              color: "#171717",
              fontSize: 30,
              fontWeight: 800,
              lineHeight: 1.35,
            }}
          >
            {t("sidebar.clinicName")}
          </h1>

          <p
            style={{
              margin: "4px 0 0",
              color: "#717182",
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            {t("home.welcome", { date: formattedDate })}
          </p>
        </div>

        <div
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
            textAlign: "start",
          }}
        >
          <section className="home-edit-card" style={cardStyle}>
            <button
              type="button"
              className="home-edit-btn"
              aria-label={t("home.editVision")}
              title={t("home.edit")}
              data-testid="btn-edit-vision"
              onClick={() => openEditor("vision", visionText)}
              style={{ background: "transparent", border: "none", padding: 6, borderRadius: 8, cursor: "pointer", lineHeight: 0 }}
            >
              <Pencil size={16} color="#717182" />
            </button>
            <h2 style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 12px", color: "#50C878", fontSize: 20, fontWeight: 800 }}>
              <Compass size={22} strokeWidth={1.9} />
              {t("home.visionTitle")}
            </h2>
            <p style={{ margin: 0, color: "#4B5563", fontSize: 15, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
              {visionText}
            </p>
          </section>

          <section className="home-edit-card" style={cardStyle}>
            <button
              type="button"
              className="home-edit-btn"
              aria-label={t("home.editMission")}
              title={t("home.edit")}
              data-testid="btn-edit-mission"
              onClick={() => openEditor("mission", missionText)}
              style={{ background: "transparent", border: "none", padding: 6, borderRadius: 8, cursor: "pointer", lineHeight: 0 }}
            >
              <Pencil size={16} color="#717182" />
            </button>
            <h2 style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 12px", color: "#50C878", fontSize: 20, fontWeight: 800 }}>
              <HeartHandshake size={22} strokeWidth={1.9} />
              {t("home.missionTitle")}
            </h2>
            <p style={{ margin: 0, color: "#4B5563", fontSize: 15, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
              {missionText}
            </p>
          </section>
        </div>
      </div>
      {editingKind && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="dialog-edit-home-text"
          onClick={event => {
            if (event.target === event.currentTarget) setEditingKind(null);
          }}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, direction: isRTL ? "rtl" : "ltr" }}
        >
          <div style={{ width: "92%", maxWidth: 520, background: "#fff", borderRadius: 16, padding: 28, boxSizing: "border-box" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#171717", marginBottom: 8 }}>
              {t(editingKind === "vision" ? "home.editVision" : "home.editMission")}
            </div>
            <div style={{ fontSize: 13, color: "#717182", marginBottom: 16 }}>
              {t("home.editLangNote")}
            </div>
            <textarea
              dir="auto"
              autoFocus
              rows={6}
              maxLength={HOME_TEXT_MAX_LENGTH}
              value={draft}
              onChange={event => setDraft(event.target.value)}
              data-testid="input-home-text"
              style={{ width: "100%", boxSizing: "border-box", background: "#F3F3F5", border: "1px solid #F1F1F1", borderRadius: 8, padding: "10px 12px", fontSize: 14, lineHeight: 1.8, fontFamily: "'Cairo', sans-serif", resize: "vertical", color: "#171717" }}
            />
            <div style={{ textAlign: "end", color: "#9CA3AF", fontSize: 12, marginTop: 4 }}>
              {draft.length}/{HOME_TEXT_MAX_LENGTH}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={restoreDefault}
                data-testid="btn-home-restore-default"
                style={{ padding: "8px 0", border: "none", background: "transparent", color: "#717182", fontSize: 13, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
              >
                {t("home.restoreDefault")}
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditingKind(null)}
                  data-testid="btn-cancel-home-text"
                  style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #F1F1F1", background: "#F9FAFB", color: "#374151", fontSize: 13, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={saveHomeText}
                  disabled={draft.trim() === editingText}
                  data-testid="btn-save-home-text"
                  style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#50C878", color: "#fff", fontSize: 13, fontWeight: 700, cursor: draft.trim() === editingText ? "not-allowed" : "pointer", opacity: draft.trim() === editingText ? 0.6 : 1, fontFamily: "'Cairo', sans-serif" }}
                >
                  {t("common.save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}