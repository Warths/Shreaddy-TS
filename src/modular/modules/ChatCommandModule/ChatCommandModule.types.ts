import { ChatMessage } from "src/modular/services/chatService/chatService.types"
import { CommandControl, CommandControlRequired, CommandFlag, CommandRemain } from "./ChatCommandModule.classes"

export type Command = {
    identifier: string
    triggers: string[]
    cooldown: number
    requiredCapabilities: string[]
    canBypassCooldown: string[]
    active: boolean
    publicActive: boolean
    privateActive: boolean
    allowOrigins: string[]
    callbacks: CommandCallbacks
}

export type CommandCallbacks = {
    handle?: (args: string, chatMessage:ChatMessage, command: Command) => void
    inactive?: (trigger: string, chatMessage:ChatMessage) => void
    forbidden?: (trigger: string, chatMessage:ChatMessage) => void
    cooldown?: (trigger: string, chatMessage:ChatMessage) => void
    originNotAllowed?: (trigger: string, chatMessage:ChatMessage) => void
    performed?: (trigger: string, chatMessage:ChatMessage) => void
}

export type MinimalCommand = {
    identifier: string, 
    triggers: string[]
} & Partial<Command>


export type ParsedCommand<T = never> = {
    raw: string
    trigger: string
    prefix: string | undefined
    args: string,
}

export type ValidatorFn = (value: any) => ValidationErrors | null;

export type ValidationErrors = { [key: string]: any };

export type ValidatedControls<T> = {
    [P in keyof T]: T[P] extends CommandControlRequired ? string :
                    T[P] extends CommandControl<infer U> ? U :
                    T[P] extends CommandFlag ? boolean : 
                    T[P] extends CommandRemain ? string : never
};