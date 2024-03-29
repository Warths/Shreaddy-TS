import Modular from "@modular/classes/modular";

export function Action(name: string) {
    return function (target: any, propertyKey: string) {
        const modular = Modular.getInstance()
        modular.registerAction(name, target.constructor, propertyKey)
    };
  }