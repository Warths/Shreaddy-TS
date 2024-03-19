import { Module } from "@modular/core";
import { combineLatest, filter, map, take, tap} from "rxjs";
import { Tick } from "src/modular/classes/hooks/tick";
import { AfterInit, Filter, Hooks, OnInit } from "src/modular/hooks";
import { LogService } from "src/modular/services/logService";
import { TwitchAuthorizationService } from "src/services/TwitchAuthorizationService/TwitchAuthorizationService";
import { TwitchAuthorization } from "src/services/TwitchAuthorizationService/types/twitchAuthorization.type";

import tmi from "tmi.js"
import { MessageQueue, QueuedMessage } from "./TwitchChatModule.types";
import { ConfigService } from "src/modular/services/configService";
import { TwitchApiService } from "../twitchApiService";
import { ChatService } from "src/modular/services/chatService/chatService";



@Module()
export class TwitchChatModule implements OnInit, AfterInit {

    authorization!: TwitchAuthorization
    tmi!: any


    queue: MessageQueue = []
    whispQueue: MessageQueue = []

    constructor(
        private auth: TwitchAuthorizationService,
        private hooks: Hooks,
        private log: LogService,
        private chat: ChatService,
        private config: ConfigService,
        private api: TwitchApiService
    ) {}

    onInit() {
        let authorizationObservable = this.auth.initAuthorization('bot').pipe(
            map(authorization => this.authorization = authorization)
        )

        let channelObservable = this.config.get$<string>("TWITCH_CHANNEL", "").pipe(
            tap((channel) => {
                if (!channel) {
                    this.log.important("Set the channel at the TWITCH_CHANNEL key in config.json")
                }
            }),
            filter((channel) => !!channel),
            take(1)
        )

        return combineLatest([authorizationObservable, channelObservable])
    }

    async afterInit() {
        this.tmi = new tmi.Client({
            options: {
                debug: true
            },
            identity: {
                username: this.authorization.login, 
                password: "oauth:"+this.authorization.token
            }
        })

        await this.tmi.connect()
        .then(() => this.log.notice("IRC Connected."))
        .catch((error: string) =>  this.log.warning("IRC Connection error. Trying to reconnected..."))
        
        let channels = this.hooks.filter<string[]>("twitch:channels", [])

        this.tmi.on("message", (channel:string, tags:any, message:string, self:boolean) => {
            this.onMessage(channel, tags, message, self)
        })

        return Promise.all(channels.map(channel => this.tmi.join(channel).catch(() => {})))
    }



    @Tick()
    handleMessageQueue() {
        while (this.queue.length) {
            const message = <QueuedMessage> this.queue.pop()

            let promise: Promise<any>
            if (message.replyTo) {
                promise = this.tmi.reply(message.channel, message.message, message.replyTo)
            } else {
                promise = this.tmi.say(message.channel, message.message)
            }

            promise.catch(
                () => this.queue.push(message)
            )
        }

        while (this.whispQueue.length) {
            const message = <QueuedMessage> this.whispQueue.pop()
            const api = this.api.createContext(this.authorization)
            api.whisper(message.channel, message.message).subscribe()
        }
    }


    onMessage(channel: string, userstate: any, message: string, self: boolean): void {
        channel = channel.replace("#", '')

        if (self) {
            return
        } 

        if (userstate['message-type'] == "chat") {
            let chatMessage = this.chat.createMessage({
                userName: userstate['username'],
                userId: userstate['user-id'],
                content: message,
                tags: userstate,
                channel: channel,
                origin: "twitch",
                type: "public",
                capabilities: userstate.badges ? Object.keys(userstate.badges) : [],
                self: self,
                say: this.sayMessageHandlerFactory(channel),
                reply: this.replyToMessageHandlerFactory(channel, userstate.id),
                whisp: this.whispToMessageHandlerFactory(userstate['user-id']),
                globalReply: this.sayMessageHandlerFactory(channel)
            })
            this.chat.onPublicMessage(chatMessage)
            
        }

        if (userstate['message-type'] == "whisper") {
            let chatMessage = this.chat.createMessage({
                content: message,
                tags: userstate,
                channel: channel,
                origin: "twitch",
                type: "private",
                capabilities: userstate.badges ? Object.keys(userstate.badges) : [],
                self: self,
                say: this.whispToMessageHandlerFactory(userstate['user-id']),
                reply: this.whispToMessageHandlerFactory(userstate['user-id']),
                whisp: this.whispToMessageHandlerFactory(userstate['user-id']),
                globalReply: this.sayMessageHandlerFactory(channel)
            })

            this.chat.onPrivateMessage(chatMessage)
            
        }


    }

    @Filter("twitch:channels")
    twitchChannels(channels: string[]): string[] {
        const channel = this.config.get("TWITCH_CHANNEL", null)
        if (channel) {
            channels.push(channel)
        }
        return channels
    }

    sayMessageHandlerFactory(channel: string) {
        return (message: string) => this.queue.push({
            channel, message
        })
    }

    replyToMessageHandlerFactory(channel: string, messageId: string | undefined) {
        return (message: string) => this.queue.push({
            channel, message, replyTo: messageId
        })
    }

    whispToMessageHandlerFactory(userId: string) {
        return (message: string) => {
            this.whispQueue.push({channel:userId, message})
        }
    }

    sendMessage(channel: string, message: string) {
        this.queue.push({channel, message})
    }


    @Filter("bot:twitch_scopes")
    botTwitchScopes(scopes: string[]): string[] {
        return [
            "chat:read", 
            "chat:edit", 
            "channel:moderate", 
            "whispers:read", 
            "whispers:edit", 
            "channel_editor",
            "user:manage:whispers"
        ]
    }


}