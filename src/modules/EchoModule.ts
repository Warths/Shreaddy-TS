import { Module } from "@modular/core";
import { Action } from "src/modular/hooks";
import { ChatCommandModule } from "src/modular/modules/ChatCommandModule/ChatCommandModule";
import { CommandControl, CommandFlag, CommandParser, CommandRemain, Validators } from "src/modular/modules/ChatCommandModule/ChatCommandModule.classes";
import { Command, ParsedCommand } from "src/modular/modules/ChatCommandModule/ChatCommandModule.types";
import { ChatMessage } from "src/modular/services/chatService/chatService.types";

@Module()
export class EchoModule {


    constructor(private command: ChatCommandModule) {
        this.command.fromConfig({
            identifier: "echo",
            triggers: ["echo"],
        }, {
            handle: (args, message, command) => this.onRequest(args, message, command),
            cooldown: (trigger, message) => this.onEchoCooldown(trigger, message),
        })
    }
 

    onRequest(args: string, message: ChatMessage, command: Command) {
        const commandParser = new CommandParser({
            requestSearchString: new CommandRemain([Validators.required()]),
            guitar: new CommandFlag(),
            bass: new CommandFlag(),
            lead: new CommandFlag(),
            rhythm: new CommandFlag(),
        })


        if (!commandParser.valid(args)) {
            this.onEchoInvalid(message)
        }
        
        message.globalReply(args)
        this.command.onSuccess(command.identifier)

    }

    onEchoCooldown(trigger: string, message: ChatMessage) {
        message.globalReply("Command is on cooldown")
    }

    onEchoInvalid(message: ChatMessage) {
        message.globalReply("Usage : !echo <message to echo>")
    }
}