import { Action, Hooks } from "src/modular/hooks";
import { Module } from "../../core";
import { Command, CommandCallbacks, MinimalCommand, ParsedCommand } from "./ChatCommandModule.types";
import { ConfigService } from "../../services/configService";
import { ChatMessage } from "../../services/chatService/chatService.types";

@Module()
export class ChatCommandModule {

    prefixes = ["!"]
    commands: Command[] = [] 
    triggerTimestamps: {[key:string]: number} = {}

    constructor(private config: ConfigService, private hooks: Hooks) {}
    
    onInit() {
        this.config.get$("CHAT_PREFIXES", this.prefixes).subscribe(
            prefixes => this.prefixes = prefixes
        )

        this.triggerTimestamps = this.config.get("CHAT_TRIGGER_TIMESTAMPS", {})

    }

    @Action("message")
    onMessage(message: ChatMessage) {
        let prefix = this.prefixes.find(prefix => message.content!.startsWith(prefix))
        if (prefix !== undefined) {
            let fragments = message.content!.split(" ")

            let trigger = fragments[0]
            let rawArgs = fragments.slice(1).join(" ")

            trigger = trigger.replace(prefix, "")

            this.onCommand(trigger, rawArgs, message, prefix)
        }
        
    }

    registerCommand(
        command: MinimalCommand,         
        callbacks: CommandCallbacks = {}
    ) {
        let fullCommand = this._completePartial(command, callbacks)
        this.commands.push(fullCommand)
    }

    forgetCommand(identifier: string) {
        this.commands = this.commands.filter(command => command.identifier != identifier)
    }

    fromConfig(
        command: MinimalCommand,
        callbacks: CommandCallbacks = {}
    ) {
        let fullCommand = this._completePartial(command, callbacks)
        this.config.get$<Command>("command:"+command.identifier, fullCommand).subscribe(
            foundCommand => {
                this.forgetCommand(fullCommand.identifier)
                this.forgetCommand(foundCommand.identifier)
                this.registerCommand(foundCommand, callbacks)
            }
        )
    }

    _completePartial(command: MinimalCommand, callbacks: CommandCallbacks): Command {
        return {
            identifier: command.identifier,
            triggers: command.triggers,
            cooldown: command.cooldown ?? 10,
            requiredCapabilities: command.requiredCapabilities ?? [],
            canBypassCooldown: command.canBypassCooldown ?? ['moderator', 'broadcaster'],
            active: command.active ?? true,
            publicActive: command.publicActive ?? true,
            privateActive: command.privateActive ?? true,
            allowOrigins: command.allowOrigins ?? ['*'],
            callbacks: callbacks
        }
    }

    @Action("command")
    onCommand(trigger: string, args: string, message: ChatMessage, prefix: string | undefined = undefined) {
        let parsedCommand: ParsedCommand = {
            raw: message.content!,
            args, 
            trigger, 
            prefix,
        }

        this.hooks.do(["command", "triggered"], [trigger, message])

        let triggeredCommands = this.triggeredCommands(trigger)

        if (!triggeredCommands.length) {
            this.hooks.do(['command', 'not_found'], [trigger, message])
        }

        triggeredCommands.forEach(
            command => {

                // handle
                // inactive
                // forbidden
                // cooldown
                // origin_not_allowed
                // performed

                // TODO IS ACTIVE ? 
                if (!command.active) {
                    if (command.callbacks.inactive) {
                        command.callbacks.inactive(trigger, message)
                    }
                    return this.hooks.do(['command', command.identifier, 'inactive'], [trigger, message])
                }

                // TODO HAS CAPABILITIES ?
                let capabilities: string[] = this.hooks.filter(['capabilities', message.origin, String(message.userId)], message.capabilities)
                if (command.requiredCapabilities.length && !this.intersects(capabilities, command.requiredCapabilities)) {

                    if (command.callbacks.forbidden) {
                        command.callbacks.forbidden(trigger, message)
                    }
                    return this.hooks.do(['command', command.identifier,  'forbidden'], [trigger, message])
                }

                // TODO IS ON COOLDOWN ? 
                // TODO CAN BYPASS COOLDOWN ? 
                if (this.isOnCooldown(command.identifier)) {

                    if (!this.intersects(capabilities, command.canBypassCooldown)) {

                        if (command.callbacks.cooldown) {
                            command.callbacks.cooldown(trigger, message)
                        }
                        return this.hooks.do(['command', command.identifier, 'cooldown'], [trigger, message])
                    }
                }

                // TODO DOES ALLOW ORIGIN ?
                if (!command.allowOrigins.includes("*") || !command.allowOrigins.includes(message.origin)) {
                    if (command.callbacks.originNotAllowed) {
                        command.callbacks.originNotAllowed(trigger, message)
                    }
                    this.hooks.do(['command', command.identifier, 'origin_not_allowed'], [trigger, message])
                }

                if (message.type == "private" && !command.privateActive) {
                    if (command.callbacks.inactive) {
                        command.callbacks.inactive(trigger, message)
                    }
                    return this.hooks.do(['command', command.identifier, 'inactive'], [trigger, message])
                }

                if (message.type == "public" && !command.publicActive) {
                    if (command.callbacks.inactive) {
                        command.callbacks.inactive(trigger, message)
                    }
                    return this.hooks.do(['command', command.identifier,  'inactive'], [trigger, message])
                }

                if (command.callbacks.performed) {
                    command.callbacks.performed(trigger, message)
                }
                this.hooks.do(['command', command.identifier, 'performed'], [trigger, message])

                if (command.callbacks.handle) {
                    command.callbacks.handle(parsedCommand.args, message, command)
                }
                this.hooks.do(['command', command.identifier], [parsedCommand.args, message, command])
            }
        )
    }


    @Action("command:success")
    onSuccess(identifier:string) {
        let command = this.findCommandById(identifier)
        if (command) {
            this.triggerTimestamps[command.identifier] = (new Date()).getTime() / 1000
        }
    }

    isOnCooldown(identifier: string) {
        return this.getNextTriggerMinimumTime(identifier) > this.now()
    }

    triggeredCommands(trigger: string) {
        return this.commands.filter(command => command.triggers.includes(trigger))
    }

    findCommandById(identifier: string) {
        return this.commands.find(command => command.identifier == identifier)
    }

    now() {
        return (new Date()).getTime() / 1000 
    }

    getNextTriggerMinimumTime(identifier: string) {
        let command = this.findCommandById(identifier)

        if (!command) {
            return -1
        }

        if (!command.cooldown) {
            return 0
        }

        if (this.triggerTimestamps[identifier]) {
            return this.triggerTimestamps[identifier] + command.cooldown
        }

        return 0


    }

    intersects(a: string[], b: string[]) {
        return a.some(i => b.includes(i));
    }
}