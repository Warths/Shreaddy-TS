import { Module } from "@modular/core";
import { LogService } from "src/modular/services/logService";
import { TwitchAuthorizationService } from "src/services/TwitchAuthorizationService/TwitchAuthorizationService";
import { TwitchChatModule } from "./TwitchChatModule/TwitchChatModule";

@Module([
    TwitchChatModule
])
export class AppModule {
    constructor(private log: LogService, private twitch: TwitchAuthorizationService) {}
}