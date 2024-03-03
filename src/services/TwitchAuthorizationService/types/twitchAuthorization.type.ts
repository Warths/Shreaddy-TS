export type TwitchAuthorization = {
    login: string
    user_id: string
    token: string
    client_id: string
    scopes: string[] | null
    expires: number
}

export type TwitchAuthorizationRegister = {
    identifier: string
    authorization: TwitchAuthorization
    lastValidate: number
}

export type TwitchAuthorizationRequest = {
    state: string,
    identifier: string
}
