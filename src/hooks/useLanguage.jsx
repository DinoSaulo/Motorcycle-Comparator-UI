import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE, getStoredLanguage, setStoredLanguage, translate } from '../i18n';

const LanguageContext = createContext(null);

// Manages active language state, updates html lang attributes, and exposes t().
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => getStoredLanguage() ?? DEFAULT_LANGUAGE);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next) => {
    setStoredLanguage(next);
    setLanguageState(next);
  }, []);

  const t = useCallback((key, vars) => translate(language, key, vars), [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside a LanguageProvider');
  }
  return context;
}
