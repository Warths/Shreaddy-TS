export type ChatMessage = {
    content: string | null
    tags: {[key:string]: any}
    channel: string | null
    origin: string 
    type: string
    capabilities: string[]
    self: boolean
    say: (message:string) => any
    reply: (message:string) => any
    whisp: (message:string) => any
    globalReply: (message:string) => any
}
