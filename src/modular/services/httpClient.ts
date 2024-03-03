import { Injectable } from "@modular/core";
import { Observable, from } from "rxjs";

@Injectable()
export class HttpClient {

    constructor() {}

    get<T>(url: string, options: {}): Observable<T> {
        return <Observable<T>> from(
            fetch(url).then(data => data.json())
        )
    }


    post<T>(url: string, body?: Object, headers?: HeadersInit): Observable<T> {
        return <Observable<T>> from(this.asyncPost(url, body, headers))
    }

    async asyncPost(url: string, body?: Object, headers?: HeadersInit) {
        const response = await fetch(
            url, {
                method: "POST",
                headers,
                body: body ? JSON.stringify(body) : undefined
            }
        )

        try {
            return await response.json()
        } catch (err) {
            return response
        }

    }
}    