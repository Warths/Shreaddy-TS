export type QueuedMessage = {
    channel: string
    message: string
    replyTo?: string
}

export type MessageQueue = QueuedMessage[]