import { Module } from "@modular/core";
import { Tick } from "src/modular/classes/hooks/tick";
import { Action, Filter, Hooks, OnInit } from "src/modular/hooks";
import { DataStore } from "src/modular/services/DataStore/DataStore";
import { ChatMessage } from "src/modular/services/chatService/chatService.types";
import { ConfigService } from "src/modular/services/configService";
import { TwitchChatModule } from "../TwitchChatModule/TwitchChatModule";

@Module()
export class TwitchScheduledMessageModule implements OnInit {

    lastMessageDate: number = 0
    lastSelfMessageDate: number = 0
    messageCount = 0
    messageCountOnLastMessage = 0

    messageInterval: number = 0
    userMessagesBetween: number = 0
    cooldownAfterUserMessage: number = 0

    twitchChannel: string | null = null



    constructor(
        private store: DataStore, 
        private config: ConfigService, 
        private chat: TwitchChatModule,
        private hooks: Hooks
    ) {}

    onInit() {
        this.store.getNumber$("scheduled_message_module:last_user_message_date").subscribe(lastMessageDate => this.lastMessageDate = lastMessageDate)
        this.store.getNumber$("scheduled_message_module:last_self_message_date").subscribe(lastSelfMessage => this.lastSelfMessageDate = lastSelfMessage)
        this.store.getNumber$("scheduled_message_module:message_count").subscribe(messageCount => this.messageCount = messageCount)
        this.store.getNumber$("scheduled_message_module:message_count_on_last_message").subscribe(messageCount => this.messageCountOnLastMessage = messageCount)

        this.config.get$("scheduled_message_module_message_interval", 300).subscribe(messageInterval => this.messageInterval = messageInterval)
        this.config.get$("scheduled_message_module_user_message_between", 15).subscribe(userMessagesBetween => this.userMessagesBetween = userMessagesBetween)
        this.config.get$("scheduled_message_module_cooldown_after_user_message", 15).subscribe(cooldownAfterUserMessage => this.cooldownAfterUserMessage = cooldownAfterUserMessage)

        this.config.get$("TWITCH_CHANNEL", null).subscribe(twitchChannel => this.twitchChannel = twitchChannel)

        
    }

    @Action("message")
    onMessageHandler(message: ChatMessage) {
        this.store.save("scheduled_message_module:last_user_message_date", Date.now())
        this.store.save("scheduled_message_module:message_count", this.messageCount + 1)
    }

    @Tick(1)
    tick() {
        if (this.lastSelfMessageDate + this.messageInterval * 1000 > Date.now()) {
            return
        }

        if (this.lastMessageDate + this.cooldownAfterUserMessage * 1000 > Date.now()) {
            return
        }

        if (this.messageCountOnLastMessage + this.userMessagesBetween > this.messageCount) {
            return
        }

        this.sendMessage()
    }


    sendMessage() {
        let message = this.getRandomMessage()

        if (!message) {
            return 
        }

        if(!this.twitchChannel) {
            return
        }

        this.chat.sendMessage(this.twitchChannel, message)

        this.store.save("scheduled_message_module:last_self_message_date", Date.now())
        this.store.save("scheduled_message_module:message_count_on_last_message", this.messageCount)
    }


    getRandomMessage() {
        let messages: string[] = this.hooks.filter("SCHEDULED_MESSAGES", [])

        if (messages.length === 0) {
            return 
        }

        return messages[Math.floor(Math.random() * messages.length)]
    }

    

}