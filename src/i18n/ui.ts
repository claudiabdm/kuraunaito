import { en } from "./en/translation";
import { es } from "./es/translation";

export const LANGUAGES = ["en", "es"] as const;

export type Language = (typeof LANGUAGES)[number];

export const defaultLang = 'en';

export const ui: Record<Language, { [key: string]: string }> = {
    en,
    es
} as const;