import { Module } from "@modular/core";
import { Filter } from "src/modular/hooks";
import { LogService } from "src/modular/services/logService";
import { TwitchAuthorizationService } from "src/services/TwitchAuthorizationService/TwitchAuthorizationService";

@Module()
export class AppModule {
    constructor(private log: LogService, private twitch: TwitchAuthorizationService) {}

    @Filter("bot:twitch_scopes")
    twitch_scopes(scopes: string[]) {
        return scopes
    }
}