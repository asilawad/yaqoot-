import { formatDate, formatDateTime } from "@/lib/date";

export default function DateText({
  value,
  withTime = false,
}: {
  value?: string | null;
  withTime?: boolean;
}) {
  const formatted = withTime ? formatDateTime(value) : formatDate(value);
  if (!formatted) return null;

  return <bdi dir="ltr" style={{ unicodeBidi: "isolate" }}>{formatted}</bdi>;
}
