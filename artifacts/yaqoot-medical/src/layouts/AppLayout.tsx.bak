import { ReactNode } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Sidebar from "./Sidebar";

interface Props {
  children: ReactNode;
}

export default function AppLayout({ children }: Props) {
  const { isRTL } = useTranslation();

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ backgroundColor: "#F9FAFB", flexDirection: isRTL ? "row-reverse" : "row" }}
    >
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{ padding: "24px" }}>
        {children}
      </main>
    </div>
  );
}
