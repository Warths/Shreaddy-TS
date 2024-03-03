import { Injectable } from "src/modular/core";
import { CacheService } from "src/modular/services/cacheService";
import { HttpClient } from "src/modular/services/httpClient";
import { TwitchAuthorization } from "src/services/TwitchAuthorizationService/types/twitchAuthorization.type";

@Injectable()
export class TwitchApiService {


    constructor(
        private cache: CacheService,
        private http: HttpClient
    ) {}

    createContext(authorization: TwitchAuthorization) {
        return new TwitchApiContext(
            authorization,
            this.http, 
            this.cache
        )
    }

}

export class TwitchApiContext {

    apiUrl = "https://api.twitch.tv/helix/"

    constructor(
        private authorization: TwitchAuthorization,
        private http: HttpClient,
        private cache: CacheService
    ) {}

    whisper(toUserId: string | number, message: string) {
        return this.post("whispers", {
            "from_user_id": this.authorization.user_id,
            "to_user_id": toUserId.toString()
        }, {message})
    }

    post(endpoint: string, queryParams: Record<string, string>, body: Object,  headers=this.headers()) {
        return this.http.post(this.apiUrl + endpoint + this.queryParamsToString(queryParams), body, headers)
    }

    queryParamsToString(queryParams: Record<string, string>) {
        const params = new URLSearchParams(queryParams).toString()
        return params ? "?" + params : ""
    }

    headers() {
        return {
            "Authorization": "Bearer " + this.authorization.token,
            "Client-id": this.authorization.client_id,
            "Content-Type": "application/json"
        }
    }

}