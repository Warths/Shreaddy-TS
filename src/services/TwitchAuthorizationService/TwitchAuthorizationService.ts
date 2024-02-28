import { Module } from "@modular/core";
import { Request, Response } from "express";
import { Observable, Subject, combineLatest, distinct, distinctUntilChanged, filter, map, switchMap, tap } from "rxjs";
import { TWITCH_CLIENT_ID } from "src/consts";
import { Hooks } from "src/modular/hooks";
import { ConfigService } from "src/modular/services/configService";

import { HttpServerService } from "src/modular/services/httpServerService";
import { LogService } from "src/modular/services/logService";
import { Tools } from "src/modular/services/tools";

type TwitchAuthorization = {
    login: string
    user_id: string
    token: string
    client_id: string
    scopes: string[]
    expires: number
}

type TwitchAuthorizationRegister = {
    identifier: string
    authorization: TwitchAuthorization
    lastValidate: number
}

type TwitchAuthorizationRequest = {
    state: string,
    identifier: string
}


@Module()
export class TwitchAuthorizationService  {

    twitchAuthorizationsRegister: {[key:string]: Observable<TwitchAuthorization>} = {}

    twitchAuthorizationRequests: TwitchAuthorizationRequest[] = []

    constructor(
        private server: HttpServerService,
        private config: ConfigService,
        private tools: Tools,
        private log: LogService,
        private hooks: Hooks
    ) {}

    onInit() {
        this.server.get("/twitch/style.css", (req, res) => res.sendFile(__dirname + "/http/style.css"))
        this.server.get("/twitch/oauth2", (req, res) => res.sendFile(__dirname + "/http/index.html"))
        this.server.post("/twitch/oauth2", (req, res) => this.authorizationCallback(req, res))

        this.getAuthorization("bot").subscribe(
            (data: TwitchAuthorization) => console.log(data)
        )

        this.getAuthorization("bot").subscribe(
            (data: TwitchAuthorization) => console.log(data)
        )

        //this.server.openInBrowser("https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=vvsq7d0c8cn03cm11lpshicpkxpxgp&redirect_uri=http://localhost:4987/twitch/oauth2&scope=channel%3Amanage%3Apolls+channel%3Aread%3Apolls&force_verify=true")
    }

    getAuthorization(identifier: string): Observable<TwitchAuthorization> {
        let scopes: string[] = this.hooks.filter(identifier + ":twitch_scopes", [])

        if (Object.keys(this.twitchAuthorizationsRegister).includes(identifier)) {
            return this.twitchAuthorizationsRegister[identifier]
        }
        let subject = new Subject<TwitchAuthorization>()
        this.twitchAuthorizationsRegister[identifier] = subject

        combineLatest(
            [           
                this.config.get$<TwitchAuthorizationRegister[]>("TWITCH_AUTHORIZATIONS", []),
                this.config.get$<string>("TWITCH_CLIENT_ID", TWITCH_CLIENT_ID)
            ]
        ).pipe(
            map(([authorizations, clientId]) => {
                let foundAuthorization: TwitchAuthorization | undefined
                for (let authorization of authorizations ) {
                    if (authorization.authorization.client_id == clientId && identifier == authorization.identifier && scopes.every((scope) => authorization.authorization.scopes.includes(scope))) {
                        foundAuthorization = authorization.authorization
                    }
                }
                return foundAuthorization
            }),
            distinctUntilChanged(),
            tap(e => {
                if (e === undefined) {
                    this.requestTwitchAuthorization(identifier, scopes)
                }
            }),
            filter(e => e !== undefined),
            map(e => e as TwitchAuthorization),
            distinctUntilChanged((a, b) => a.token == b.token)
        ).subscribe((e) => {subject.next(e)})
        return subject
    } 

    requestTwitchAuthorization(identifier: string, scopes: string[]) {
        let state = this.tools.token(64, "abcdef")
        this.createRequest(identifier, state)
        let clientId = this.config.get("TWITCH_CLIENT_ID", TWITCH_CLIENT_ID)
        let addr = this.config.get("HTTP_SERVER_ADDR", "localhost")
        let port = this.config.get("HTTP_SERVER_PORT", 4987)
        let scopeString = scopes.join("+")

        let url = `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${clientId}&redirect_uri=http://${addr}:${port}/twitch/oauth2&scope=${scopeString}&state=${state}&force_verify=true`
        this.server.openInBrowser(url)
    }

    createRequest(identifier: string, state: string) {
        this.twitchAuthorizationRequests.push({identifier, state})
    }

    async authorizationCallback(req: Request, res: Response) {
        const body: {token: string, scopes: string[], state: string} = req.body

        let result = await this.validate(body.token)
        let authorizationRequest = this.twitchAuthorizationRequests.find(request => {
            return request.state == body.state
        })

        if (!authorizationRequest) {
            res.send({status:404})
            return
        }


        if (result.hasOwnProperty("status")) {
            res.send({status:401})
        }
        result = result as TwitchAuthorization
        let authorizationRegister: TwitchAuthorizationRegister = {
            identifier: authorizationRequest.identifier,
            authorization: {
                ...result,
                token: body.token,

            },
            lastValidate: Date.now()
        }

        let register = this.config.get<TwitchAuthorizationRegister[]>("TWITCH_AUTHORIZATIONS", []).filter(
            entry => entry.identifier != authorizationRegister.identifier
        )

        register.push(authorizationRegister)
        this.config.set("TWITCH_AUTHORIZATIONS", register)

        res.send({status: 200})
    }

    async validate(token: string): Promise<TwitchAuthorization | {status:401}>  {
        let response = await fetch("https://id.twitch.tv/oauth2/validate", {headers:{
            "Authorization": "Bearer " + token
        }})

        return await response.json()
    }
}  