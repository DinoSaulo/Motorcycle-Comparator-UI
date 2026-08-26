import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LanguageProvider, useLanguage } from './useLanguage';

function wrapper({ children }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

describe('useLanguage', () => {
  it('throws when used outside a LanguageProvider', () => {
    // Swallow the expected React error-boundary console noise for this one case.
    expect(() => renderHook(() => useLanguage())).toThrow(
      'useLanguage must be used inside a LanguageProvider',
    );
  });

  it('defaults to Portuguese when nothing is stored', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.language).toBe('pt');
  });

  it('picks up a previously stored language preference', () => {
    window.localStorage.setItem('motorcycle-comparator.language', 'en');
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.language).toBe('en');
  });

  it('switches language and persists the choice', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => result.current.setLanguage('en'));

    expect(result.current.language).toBe('en');
    expect(window.localStorage.getItem('motorcycle-comparator.language')).toBe('en');
  });

  it('keeps document.documentElement.lang in sync', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => result.current.setLanguage('en'));
    expect(document.documentElement.lang).toBe('en');
  });

  it('exposes a t() bound to the active language', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const ptText = result.current.t('nav.compare');

    act(() => result.current.setLanguage('en'));
    const enText = result.current.t('nav.compare');

    expect(ptText).not.toBe(enText);
  });
});
