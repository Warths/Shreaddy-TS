import { ModuleLoader, ModuleLoaderRegistration } from "src/modular/classes/moduleLoader"
import { AfterInit, BeforeInit, BeforeUnload, OnInit, OnUnload, implementsAfterInit,  implementsBeforeInit,  implementsBeforeUnload,  implementsOnInit, implementsOnUnload } from "./hooks/lifecycle"
import { Observable, lastValueFrom } from "rxjs"
import { FunctionConfig, FunctionRegister } from "./functionRegister"
import { Tickable, TickableRegister } from "./tickableRegister"

export default class Modular {

    static instance?: Modular
    private moduleLoader = new ModuleLoader()
    private actionRegister = new FunctionRegister()
    private filterRegister = new FunctionRegister()
    private tickableRegister = new TickableRegister()


    private shouldBeKeptAlive = true;

    static getInstance(): Modular {
        if (!Modular.instance) {
            Modular.instance = new Modular()
        }
        return Modular.instance
    }

    static run(loadables: Function[]) {
        this.bootstrap().then(
            () => Modular.scheduleTickables()
        )
    }

    private static async bootstrap() {
        const modular = Modular.getInstance();
        Modular.setupExitSignal()
        modular.loadModules()

        await modular.runHook(implementsBeforeInit, (m: BeforeInit) => m.beforeInit())
        await modular.runHook(implementsOnInit, (m: OnInit) => m.onInit())
        await modular.runHook(implementsAfterInit, (m: AfterInit) => m.afterInit())

    }

    private async runHook(guard: Function, hook: (m: any) => void | Promise<any> | Observable<any>) {
        let toResolve: Promise<any>[] = []
        for (const module of this.moduleLoader.getLoaded()) {
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
        this.moduleLoader.bootstrap()
    }

    public registerModule(constructor: new (...args: any[]) => any, dependencies: Function[], injectable: boolean) {
        const registration = new ModuleLoaderRegistration(constructor, null, dependencies, injectable)
        this.moduleLoader.addRegistration(registration)
    }

    public registerAction(name: string, target: new (...args: any[]) => any, propertyKey: string) {
        const action = new FunctionConfig(name, target, propertyKey)
        this.actionRegister.add(action)
    }

    public doAction(name: string, args: any[] = []) {
        this.actionRegister.get(name).forEach(action => {
            const module = this.moduleLoader.resolveDependency(action.target)
            if (module) {
                module[action.propertyKey](...args)
            }
        })
    }

    public runTickables() {
        for (let tickable of this.tickableRegister.getReadyTickables()) {
            let module = this.moduleLoader.resolveDependency(tickable.target)
            if (module) {
                tickable.run(module[tickable.propertyKey]())
            }
        }
    }

    public registerFilter(name: string, target: new (...args: any[]) => any, propertyKey: string) {
        const filter = new FunctionConfig(name, target, propertyKey)
        this.filterRegister.add(filter)
    }

    public applyFilters<T = any>(name: string, value: any): T {
        this.filterRegister.get(name).forEach(filter => {
            const module = this.moduleLoader.resolveDependency(filter.target)
            if (module) {
                value = module[filter.propertyKey](value)
            }
        })
        return value
    }

    public registerTickable(frequency: number, maxAlive: number, target: new (...args: any[]) => any, propertyKey: string) {
        const tickable = new Tickable(frequency, maxAlive, target, propertyKey)
        this.tickableRegister.add(tickable)
    }

    private static setupExitSignal() {
        const modular = Modular.getInstance()
        process.on("SIGINT", () => {
            modular.runHook(implementsBeforeUnload, (m: BeforeUnload) => m.beforeUnload())
            .then(() => modular.runHook(implementsOnUnload, (m: OnUnload) => m.onUnload()))
            .then(() => {
                modular.shouldBeKeptAlive = false
                process.kill(process.pid, "SIGINT")
            })
        }) 
    }

    private static scheduleTickables() {
        const modular = Modular.getInstance()
        function run() { 
            if (modular.shouldBeKeptAlive) {
                modular.runTickables()
                setTimeout(run, 10)
            }
        }
        run()
    }
} 