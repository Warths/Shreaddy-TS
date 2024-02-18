import { ModuleLoader, ModuleLoaderRegistration } from "src/modular/classes/moduleLoader"
import { AfterInit, OnInit, implementsAfterInit, implementsBeforeUnload, implementsOnInit } from "./hooks/lifecycle"
import { Observable, lastValueFrom } from "rxjs"

class Action {
    constructor(
        private name: string, 
        private target: new (...args: any[]) => any, 
        private propertyKey: string
    ) {}

    getName() {
        return this.name
    }
}

class ActionRegister {
    actions: Action[] = []

    find(name: string) {
        return this.actions.filter(action => action.getName() == name)
    }
}

export default class Modular {

    static instance?: Modular
    private ModuleLoader = new ModuleLoader()
    private ActionRegister = new ActionRegister()

    static getInstance(): Modular {
        if (!Modular.instance) {
            Modular.instance = new Modular()
        }
        return Modular.instance
    }

    static async run(loadables: Function[]) {
        this.bootstrap()
    }

    private static async bootstrap() {
        const modular = Modular.getInstance();
        this.setupExitSignal()
        modular.loadModules()

        await modular.runHook(implementsOnInit, (m: OnInit) => m.onInit())
        await modular.runHook(implementsAfterInit, (m: AfterInit) => m.afterInit())
    }

    private async runHook(guard: Function, hook: (m: any) => void | Promise<any> | Observable<any>) {
        let toResolve: Promise<any>[] = []
        for (const module of this.ModuleLoader.getLoaded()) {
            if (guard(module)) {
                let result = hook(module)

                if (result instanceof Observable) {
                    result = lastValueFrom(result)
                }

                if (result instanceof Promise) {
                    toResolve.push(result)
                }
            }
        }
        return Promise.all(toResolve)
    }

    public loadModules() {
        this.ModuleLoader.doThings()
    }

    public registerModule(constructor: new (...args: any[]) => any, dependencies: Function[], injectable: boolean) {
        const registration = new ModuleLoaderRegistration(constructor, null, dependencies, injectable)
        this.ModuleLoader.addRegistration(registration)
    }

    public registerAction(name: string, target: new (...args: any[]) => any, propertyKey: string) {
        const action = new Action(name, target, propertyKey)

    }

    private static setupExitSignal() {
        process.on("SIGINT", () => {
            console.log("before exit")
            process.kill(process.pid, "SIGINT");
        })
    }
}