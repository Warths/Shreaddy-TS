import { Injectable } from "@modular/core";
import { StorageService } from "./storageService";
import { Observable, distinctUntilChanged, map, take, tap } from "rxjs";

@Injectable()
export class ConfigService {

    configPath = "config.json"

    config: any = {}
    config$ = this.storage.observeJson(this.configPath).pipe(
        tap(config => this.config = config)
    )

    constructor(private storage: StorageService) {
        this.config$.subscribe()
    }

    get<T = any>(key: string, defaultValue: T): T {
        if (this.config.hasOwnProperty(key)) {
            return this.config[key]
        }
        this.set(key, defaultValue)
        return defaultValue
    }

    get$<T = any>(key: string, defaultValue: T): Observable<T> {
        return this.config$.pipe(
            map((config: any) => {
                if (config.hasOwnProperty(key)) {
                    return config[key]
                }
                this.set(key, defaultValue)
                return defaultValue
            }),
            distinctUntilChanged((previous, current) => {
                let a: T | string = previous;
                let b: T | string = current;

                if (previous instanceof Object) {
                    a = JSON.stringify(previous)
                }
                if (current instanceof Object) {
                    b = JSON.stringify(current)
                }

                return previous == current
            })
        )
    }

    take$<T = any>(key: string, defaultValue: T): Observable<T> {
        return this.get$(key, defaultValue).pipe(take(1))
    }

    set<T = any>(name: string, value: T): void {
        this.config[name] = value
        this.storage.writeJson(this.configPath, this.config)
    }


}    