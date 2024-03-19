import { Module } from "@modular/core";
import { OnInit } from "src/modular/hooks";
import { ChatCommandModule } from "src/modular/modules/ChatCommandModule/ChatCommandModule";
import { CommandFlag, CommandParser, CommandRemain, Validators } from "src/modular/modules/ChatCommandModule/ChatCommandModule.classes";
import { Command } from "src/modular/modules/ChatCommandModule/ChatCommandModule.types";
import { Translatable } from "src/modular/modules/I18nService/I18n.types";
import { I18nService } from "src/modular/modules/I18nService/I18nService";
import { ChatMessage } from "src/modular/services/chatService/chatService.types";

@Module()
export class EchoModule implements Translatable, OnInit {

    domain = "echo_module"
    translations = {
        command_usage: "Usage : !echo <message to echo>",
        command_cooldown: "Command is on cooldown"
    }


    constructor(private command: ChatCommandModule, private lang: I18nService) {}

    onInit() {
        this.lang.register(this)

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
        message.globalReply(this.lang.get("command_cooldown", this.domain, 'fr'))
    }

    onEchoInvalid(message: ChatMessage) {
        message.globalReply("Usage : !echo <message to echo>")
    }
}