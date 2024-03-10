import { Module } from "@modular/core";
import { TwitchChatModule } from "./TwitchChatModule/TwitchChatModule";
import { ChatCommandModule } from "src/modular/modules/ChatCommandModule/ChatCommandModule";

@Module([
    TwitchChatModule,
    ChatCommandModule
])
export class AppModule {}