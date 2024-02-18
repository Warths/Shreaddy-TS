import Modular from "@modular/classes/modular";

export function Action(obj: Object, name: string) {
    console.log("action(): factory evaluated");
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const modular = Modular.getInstance()
        modular.registerAction(name, target.constructor, propertyKey)

    };
  }