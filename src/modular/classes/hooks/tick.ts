import Modular from "@modular/classes/modular";

export function Tick(frequency: number, maxAlive: number = 1) {
    return function (target: any, propertyKey: string) {
        const modular = Modular.getInstance()
        modular.registerTickable(frequency, maxAlive, target.constructor, propertyKey)
    };
  }

