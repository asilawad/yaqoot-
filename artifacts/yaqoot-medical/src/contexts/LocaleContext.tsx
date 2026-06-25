import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { ar } from '../lib/i18n/ar';
import { en } from '../lib/i18n/en';

type Locale = 'ar' | 'en';
type Translations = typeof ar;

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isRTL: boolean;
  t: (key: keyof Translations | string, params?: Record<string, string | number>) => string;
}

export const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('yaqoot_locale');
    return (saved as Locale) || 'ar';
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('yaqoot_locale', newLocale);
  };

  useEffect(() => {
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [locale]);

  const isRTL = locale === 'ar';

  const t = (key: string, params?: Record<string, string | number>) => {
    const translations: Record<string, string> = locale === 'ar' ? ar : en;
    let text = translations[key] || key;

    if (params) {
      Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, String(params[param]));
      });
    }

    return text;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, isRTL, t }}>
      {children}
    </LocaleContext.Provider>
  );
};
