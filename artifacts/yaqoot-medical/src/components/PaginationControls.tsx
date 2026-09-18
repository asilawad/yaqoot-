import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

type PaginationControlsProps = {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
};

export default function PaginationControls({
  page,
  setPage,
  totalPages,
}: PaginationControlsProps) {
  const { t, isRTL } = useTranslation();

  return (
    <nav
      aria-label={t("pagination.navigation")}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "16px 0 4px",
      }}
    >
      <button
        type="button"
        data-testid="pagination-prev"
        aria-label={t("pagination.previous")}
        disabled={page <= 1}
        onClick={() => setPage(Math.max(1, page - 1))}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #DDE5DF",
          background: "#fff",
          color: "#374151",
          cursor: page <= 1 ? "not-allowed" : "pointer",
          opacity: page <= 1 ? 0.45 : 1,
          fontFamily: "'Cairo', sans-serif",
        }}
      >
        {isRTL ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        {t("pagination.previous")}
      </button>
      <span style={{ color: "#717182", fontSize: 13, minWidth: 92, textAlign: "center" }}>
        {t("pagination.pageOf", { page, total: totalPages })}
      </span>
      <button
        type="button"
        data-testid="pagination-next"
        aria-label={t("pagination.next")}
        disabled={page >= totalPages}
        onClick={() => setPage(Math.min(totalPages, page + 1))}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #DDE5DF",
          background: "#fff",
          color: "#374151",
          cursor: page >= totalPages ? "not-allowed" : "pointer",
          opacity: page >= totalPages ? 0.45 : 1,
          fontFamily: "'Cairo', sans-serif",
        }}
      >
        {t("pagination.next")}
        {isRTL ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
      </button>
    </nav>
  );
}