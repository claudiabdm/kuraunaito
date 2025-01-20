import { ui, defaultLang, type Language } from './ui';

export function getLangFromUrl(url: URL): Language {
    const [, lang] = url.pathname.split('/');
    if (lang in ui) return lang as Language;
    return defaultLang;
}

export function t(key: string, lang: Language = defaultLang) {
    return ui[lang]?.[key] || ui[defaultLang]?.[key] || key;
}

export function useTranslations(url: URL): typeof t {
    const lang = getLangFromUrl(url)
    return (key, l = lang) => t(key, l);
}