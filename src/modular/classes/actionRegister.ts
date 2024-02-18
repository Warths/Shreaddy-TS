export class ModuleLoader {
    private modules: ModuleLoaderRegistration[] = []

    constructor() {}

    addRegistration(registration: ModuleLoaderRegistration) {
        this.modules.push(registration)
    }

    doThings() {
        let loadables = this.getLoadlables()
        while (loadables.length) {
            loadables.forEach(loadable => this.load(loadable))
            loadables = this.getLoadlables()
        }
    }

    load(registration: ModuleLoaderRegistration) {

        const dependencies = this.resolveDependencies(registration)
        registration.createInstance(dependencies)
    }

    resolveDependencies(registration: ModuleLoaderRegistration) {
        return registration.dependencies.map(
            dependency => this.resolveDependency(dependency)
        )
    }

    resolveDependency(dependency: Function) {
        for (let module of this.modules) {
            if (module.registrableConstructor == dependency) {
                return module.instance
            }
        }
    }

    getLoadlables() {
        const loaded: Function[] = this.modules.filter(e => e.instance).map(e => e.registrableConstructor)
        return this.modules.filter(module => !module.instance && module.dependencies.every(dependency => loaded.includes(dependency))) 
    }

    getUnloaded() {
        return this.modules.filter(e => !e.instance).map(e => e.registrableConstructor)
    }

    getLoaded() {
        return this.modules.filter(e => e.instance).map(e => e.instance)
    }

}

export class ModuleLoaderRegistration {
    constructor(
        public registrableConstructor: new (...dependencies: any[]) => any,
        public instance: any | null,
        public dependencies: any[], 
        public injectable: boolean
    ) {}

    createInstance(dependencies: any[]) {
        this.instance = new this.registrableConstructor(...dependencies)
    }
}
