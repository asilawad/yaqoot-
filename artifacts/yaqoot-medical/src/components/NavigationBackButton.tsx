import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface NavigationBackButtonProps {
  to: string;
  testId: string;
  labelKey?: "common.back" | "profile.back";
}

export default function NavigationBackButton({
  to,
  testId,
  labelKey = "common.back",
}: NavigationBackButtonProps) {
  const { t, isRTL } = useTranslation();
  const [, setLocation] = useLocation();
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <button
      type="button"
      onClick={() => setLocation(to)}
      data-testid={testId}
      aria-label={t(labelKey)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "none",
        border: "none",
        padding: 0,
        color: "#717182",
        fontSize: 14,
        cursor: "pointer",
        marginBottom: 24,
        fontFamily: "'Cairo', sans-serif",
        lineHeight: 1.5,
        flexDirection: "row",
      }}
    >
      <Arrow size={16} strokeWidth={2} aria-hidden="true" />
      <span>{t(labelKey)}</span>
    </button>
  );
}