import Modular from "@modular/classes/modular";

export function Module() {
    return function Inner(constructor: new (...args: any[]) => any) {
        const dependencies = Reflect.getMetadata('design:paramtypes', constructor) || [];
        const modular = Modular.getInstance()
        modular.registerModule(constructor, dependencies, false)
    }
}

export function Injectable() {
    return function Inner(constructor: new (...args: any[]) => any) {
        const dependencies = Reflect.getMetadata('design:paramtypes', constructor) || [];
        const modular = Modular.getInstance()
        modular.registerModule(constructor, dependencies, true)
    }
}