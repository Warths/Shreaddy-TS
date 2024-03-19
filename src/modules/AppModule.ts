import { Module } from "@modular/core";
import { TwitchChatModule } from "./TwitchChatModule/TwitchChatModule";
import { ChatCommandModule } from "src/modular/modules/ChatCommandModule/ChatCommandModule";
import { DatabaseService } from "src/modular/services/databaseService/databaseService";
import { TwitchScheduledMessageModule } from "./ScheduledMessageModule/ScheduledMessageModule";
import { ChatLanguageDetectionModule } from "../modular/modules/ChatLanguageDetection/ChatLanguageDetection";
import { FrenchDetectionModule } from "./ChatLanguageDetectionModule copy/FrenchDetectionModule";
import { EnglishDetectionModule } from "./ChatLanguageDetectionModule copy/EnglishDetectionModule";

@Module([
    TwitchChatModule,
    ChatCommandModule,
    DatabaseService,
    TwitchScheduledMessageModule,
    ChatLanguageDetectionModule,
    FrenchDetectionModule, 
    EnglishDetectionModule
])
export class AppModule {} 