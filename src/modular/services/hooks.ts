import { Injectable, Modular } from "../core";

@Injectable()
export class Hooks {
    private modular: Modular = Modular.getInstance()

    constructor() {}

    do(name: string | string[], args: any[] = []) {
        this.modular.doAction(this.sanitize(name), args)
    }

    filter<T>(name: string | string[], value: any): T {
        return this.modular.applyFilters<T>(this.sanitize(name), value)
    }

    private sanitize(name: string | string[]) {
        if (Array.isArray(name)) {
            name = name.join(":")
        }
        return name
    }

}