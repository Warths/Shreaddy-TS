import { Module } from "src/modular/core";
import { Action, Hooks } from "src/modular/hooks";
import { DataStore } from "src/modular/services/DataStore/DataStore";
import { ChatMessage } from "src/modular/services/chatService/chatService.types";
import { I18nService } from "../I18nService/I18nService";


@Module()
export class ChatLanguageDetectionModule {

    constructor(private hooks: Hooks, private store: DataStore, private i18n: I18nService) {}

    @Action("message")
    async onMessageHandler(message: ChatMessage) {
        let langs = this.hooks.filter<string[]>("languages", [])

        for (let lang of langs) {
            let score = 0
            let words = this.hooks.filter<string[]>("languages:common_words:" + lang, [])
            let split = message.content?.toLowerCase().split(" ")
            if (split && split.length && words.length) {
                for (let word of words) {
                    if (split.includes(word)) {
                        score++ 
                    }
                }
            }
            
            let storeKey = message.origin + ":" + message.userId + ':language:' + lang
            let previousScore = await this.store.getNumber(storeKey)
            await this.store.save(storeKey, previousScore + score)
        }
    }


    async getLang(origin: string, userId: string): Promise<string> {

        let lang = this.i18n.defaultLang

        let promises = this.hooks.filter<string[]>("languages", []).map(
            lang => this.store.getNumber(origin + ":" + userId + ':language:' + lang).then(value => {return {lang, value}})
        )

        let results = await Promise.all(promises)

        lang = results.reduce((previous, current) => {
            return (current.value > previous.value ? current : previous)
        }, {lang:lang, value:0}).lang

        return lang

    }



}