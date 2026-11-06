/** Read the explicit browser preference before character-save hydration. */
export function readStartupLocale(): 'zh-CN' | 'en' {
  try {
    const cached = typeof window === 'undefined'
      ? null
      : window.localStorage.getItem('i18nextLng');
    return cached === 'en' ? 'en' : 'zh-CN';
  } catch {
    // Tiny preferences are optional when browser storage is unavailable.
    return 'zh-CN';
  }
}
