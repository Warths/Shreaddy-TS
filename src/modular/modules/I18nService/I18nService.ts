import { Injectable } from "src/modular/core";
import { Translatable } from "./I18n.types";
import { ConfigService } from "src/modular/services/configService";
import { Filter, OnInit } from "src/modular/hooks";
import { StorageService } from "src/modular/services/storageService";
import { BeforeInit } from "src/modular/classes/hooks/lifecycle";

@Injectable()
export class I18nService implements BeforeInit {


    langs: string[] = ['en']
    defaultLang: string = 'en'

    loadedTranslations: Record<string, Record<string, Record<string, string>>> = {}

    constructor(private config: ConfigService, private storage: StorageService) {}

    beforeInit() {
        this.config.get$("LANGS", this.langs).subscribe(
            langs => this.langs = langs
        )

        this.config.get$("LANG_DEFAULT", this.defaultLang).subscribe(
            lang => this.defaultLang = lang
        )

        return this.config.loaded$
    }

    register(translatable: Translatable): void {
        this.appendTranslations(translatable.domain, translatable.translations, this.langs, this.defaultLang)
        this.loadTranslations(translatable.domain, this.langs)
    }

    get(source: string, domain: string, lang: string): string {
        let translation: string | undefined 
        translation = this.loadedTranslations[domain]?.[lang]?.[source] 

        if (typeof translation === 'undefined' || translation === "") {
            translation = this.loadedTranslations[domain]?.[this.defaultLang]?.[source]
        }

        if (typeof translation === 'undefined' || translation === "") {
            return source
        }

        return translation

    }

    @Filter("languages")
    onLanguagesFilter(langs: string[]): string[] {
        this.langs.forEach(lang => {if (!langs.includes(lang)) {langs.push(lang)}})
        return langs
    }

    appendTranslations(domain: string, translations: Record<string, string>, langs: string[], defaultLang: string) {
        for (let lang of langs) {
            let filePath = this.path(domain, lang)
            let existingTranslations = this.storage.readJson(filePath)
            for (let [key, value] of Object.entries(translations)) {
                if (!(existingTranslations.hasOwnProperty(key))) {
                    existingTranslations[key] = lang == defaultLang ? value : ''
                }
            }

            this.storage.writeJson(filePath, existingTranslations)
        }
    }


    loadTranslations(domain: string, langs: string[]): void {
        for (let lang of langs) {
            this.storage.observeJson(this.path(domain, lang)).subscribe(
                translations => {
                    if (!this.loadedTranslations.hasOwnProperty(domain)) {
                        this.loadedTranslations[domain] = {}
                    }

                    if (!this.loadedTranslations[domain].hasOwnProperty(lang)) {
                        this.loadedTranslations[domain][lang] = {}
                    }

                    this.loadedTranslations[domain][lang] = translations
                }
            )
        }
    }

    path(domain: string, lang: string) {
        return `translations/${domain}/${lang}.json`
    }
}