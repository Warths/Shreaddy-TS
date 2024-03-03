import { Module } from "@modular/core";
import { Filter, Hooks } from "../../hooks";
import { ChatMessage } from "./chatModule.types";


@Module()
export class ChatModule {

    voidMessageHandler = (message:string) => {}

    constructor(private hooks: Hooks) {}

    @Filter("createMessage")
    createMessage(payload: Partial<ChatMessage>): ChatMessage {
        return {
           content: payload.content ?? null,
           tags: payload.tags ?? {},
           channel: payload.channel ?? null,
           origin: payload.origin ?? 'unknown',
           type: payload.type ?? "unknown",
           capabilities: payload.capabilities ?? [],
           self: payload.self ?? false,
           say: payload.say ?? this.voidMessageHandler,
           reply: payload.reply ?? this.voidMessageHandler,
           whisp: payload.whisp ?? this.voidMessageHandler,
           globalReply: payload.globalReply ?? this.voidMessageHandler
        }
    }

    onPublicMessage(chatMessage: ChatMessage): void {
        if (this.hooks.filter("should-handle-message", true)) {
            this.hooks.do("public-message", [chatMessage])
            this.hooks.do("message", [chatMessage])
            console.log(chatMessage)
        }
    }

    onPrivateMessage(chatMessage: ChatMessage): void {
        if (this.hooks.filter("should-handle-message", true)) {
            this.hooks.do("private-message", [chatMessage])
            this.hooks.do("message", [chatMessage])
        }
        console.log(chatMessage)
    }

}    