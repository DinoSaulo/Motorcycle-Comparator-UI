import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_NAMES,
  SUPPORTED_LANGUAGES,
  getStoredLanguage,
  setStoredLanguage,
  translate,
} from './index';

describe('translate', () => {
  it('resolves a nested dot-separated key', () => {
    expect(translate('en', 'nav.compare')).not.toBe('nav.compare');
  });

  it('falls back to English when the key is missing from the requested language', () => {
    // pt and en are kept in lockstep by convention; simulate a gap by requesting a
    // language whose dictionary does not exist at all, which forces the English path.
    expect(translate('fr', 'nav.compare')).toBe(translate('en', 'nav.compare'));
  });

  it('falls back to the key itself when missing everywhere', () => {
    expect(translate('en', 'this.key.does.not.exist')).toBe('this.key.does.not.exist');
  });

  it('interpolates {{vars}} into the template', () => {
    const result = translate('en', 'compare.identicalSpecs', { count: 3 });
    expect(result).toContain('3');
  });

  it('leaves an unmatched placeholder untouched', () => {
    const result = translate('en', 'nav.compare', { unused: 'x' });
    expect(result).not.toContain('undefined');
  });

  it('returns the template as-is when no vars are supplied', () => {
    expect(translate('en', 'nav.compare', undefined)).toBe(translate('en', 'nav.compare'));
  });
});

describe('language persistence', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('returns null when nothing is stored', () => {
    expect(getStoredLanguage()).toBeNull();
  });

  it('round-trips a supported language', () => {
    setStoredLanguage('en');
    expect(getStoredLanguage()).toBe('en');
  });

  it('rejects an unsupported stored value', () => {
    window.localStorage.setItem('motorcycle-comparator.language', 'klingon');
    expect(getStoredLanguage()).toBeNull();
  });

  it('returns null instead of throwing when localStorage.getItem throws', () => {
    const spy = vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getStoredLanguage()).toBeNull();
    spy.mockRestore();
  });

  it('does not throw when localStorage.setItem throws', () => {
    const spy = vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => setStoredLanguage('en')).not.toThrow();
    spy.mockRestore();
  });
});

describe('constants', () => {
  it('defaults to Portuguese', () => {
    expect(DEFAULT_LANGUAGE).toBe('pt');
  });

  it('supports exactly pt and en', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['pt', 'en']);
  });

  it('names each supported language', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(LANGUAGE_NAMES[lang]).toBeTruthy();
    }
  });
});
