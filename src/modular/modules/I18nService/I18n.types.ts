export type Translations = Record<string, string>

export interface Translatable {
    domain: string
    translations: Translations
}
