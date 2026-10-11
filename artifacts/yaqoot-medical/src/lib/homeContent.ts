export const HOME_TEXT_MAX_LENGTH = 600;
export type HomeTextKind = "vision" | "mission";
export type HomeLocale = "ar" | "en";

const kinds: HomeTextKind[] = ["vision", "mission"];
const locales: HomeLocale[] = ["ar", "en"];

function storageKey(kind: HomeTextKind, locale: HomeLocale): string {
  return `yaqoot:home:${kind}:${locale}`;
}

export function getHomeText(kind: HomeTextKind, locale: HomeLocale): string | null {
  try {
    const value = localStorage.getItem(storageKey(kind, locale));
    const trimmed = value?.trim();
    return trimmed || null;
  } catch {
    return null;
  }
}

export function setHomeText(kind: HomeTextKind, locale: HomeLocale, text: string): boolean {
  try {
    const key = storageKey(kind, locale);
    const trimmed = text.trim();
    if (!trimmed) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, trimmed);
    }
    return true;
  } catch {
    return false;
  }
}

export function clearHomeText(kind: HomeTextKind, locale: HomeLocale): boolean {
  try {
    localStorage.removeItem(storageKey(kind, locale));
    return true;
  } catch {
    return false;
  }
}

export function exportHomeContent(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const kind of kinds) {
    for (const locale of locales) {
      const text = getHomeText(kind, locale);
      if (text !== null) result[`${kind}:${locale}`] = text;
    }
  }
  return result;
}

export function importHomeContent(value: unknown): void {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return;

    const content = value as Record<string, unknown>;
    for (const kind of kinds) {
      for (const locale of locales) {
        const key = storageKey(kind, locale);
        const importKey = `${kind}:${locale}`;
        try {
          localStorage.removeItem(key);
          const text = content[importKey];
          if (typeof text !== "string") continue;
          const trimmed = text.trim();
          if (trimmed && trimmed.length <= HOME_TEXT_MAX_LENGTH) {
            localStorage.setItem(key, trimmed);
          }
        } catch {
          // Invalid values or unavailable storage must not interrupt a restore.
        }
      }
    }
  } catch {
    // Home content is optional and must never make a restore fail.
  }
}
