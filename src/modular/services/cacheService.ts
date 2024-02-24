import { Injectable } from "@modular/core";

@Injectable()
export class CacheService {

    cache: Record<string, {timestamp: number, value: any}> = {}

    constructor() {}

    set<T = any>(key: string, value: T) {
        this.cache[key] = {
            timestamp: Date.now(),
            value
        }
    }

    get<T = any>(key: string, maxAge = 60): T | null {
        if (this.cache[key] && this.cache[key]['timestamp'] + maxAge > Date.now()) {
            return this.cache[key] as T;
        }
        return null
    }

    invalidate(key: string) {
        if (this.cache[key]) {
            delete this.cache[key]
        }
    }

}    