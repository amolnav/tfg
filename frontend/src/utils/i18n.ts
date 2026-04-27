export function getBaseLanguage(language?: string) {
  return language?.split('-')[0] || 'es';
}
