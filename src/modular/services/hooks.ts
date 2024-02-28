import { Injectable, Modular } from "../core";

@Injectable()
export class Hooks {
    private modular: Modular = Modular.getInstance()

    constructor() {}

    do(name: string, args: any[] = []) {
        this.modular.doAction(name, args)
    }

    filter<T>(name: string, value: any): T {
        return this.modular.applyFilters<T>(name, value)
    }

}