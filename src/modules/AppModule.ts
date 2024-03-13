import { Module } from "@modular/core";
import { TwitchChatModule } from "./TwitchChatModule/TwitchChatModule";
import { ChatCommandModule } from "src/modular/modules/ChatCommandModule/ChatCommandModule";
import { DatabaseService } from "src/modular/services/databaseService/databaseService";
import { DataStore } from "src/modular/services/DataStore/DataStore";

@Module([
    TwitchChatModule,
    ChatCommandModule,
    DatabaseService
])
export class AppModule {
    constructor(store: DataStore) {}
} 