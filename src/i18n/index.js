import en from './translations/en';
import pt from './translations/pt';

// Default language configuration (Portuguese default).
export const DEFAULT_LANGUAGE = 'pt';
export const SUPPORTED_LANGUAGES = ['pt', 'en'];

/** Each entry's own name, shown in the switcher regardless of the active language. */
export const LANGUAGE_NAMES = { pt: 'Português', en: 'English' };

const TRANSLATIONS = { en, pt };

const STORAGE_KEY = 'motorcycle-comparator.language';

function resolve(dictionary, key) {
  return key
    .split('.')
    .reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), dictionary);
}

function interpolate(template, vars) {
  if (typeof template !== 'string' || !vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

// Translates dot-separated key for specified language with English fallback.
export function translate(language, key, vars) {
  const template = resolve(TRANSLATIONS[language], key) ?? resolve(TRANSLATIONS.en, key) ?? key;
  return interpolate(template, vars);
}

/** Persisted preference, or `null` when unset/unavailable — mirrors `services/api.js`. */
export function getStoredLanguage() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_LANGUAGES.includes(stored) ? stored : null;
  } catch {
    // Private browsing and blocked site data both throw here; falling back to the
    // default language is not fatal.
    return null;
  }
}

export function setStoredLanguage(language) {
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    /* see getStoredLanguage */
  }
}
