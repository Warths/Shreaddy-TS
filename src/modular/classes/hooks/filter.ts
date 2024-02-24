import Modular from "@modular/classes/modular";

export function Filter(name: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const modular = Modular.getInstance()
        modular.registerFilter(name, target.constructor, propertyKey)
    };
  }