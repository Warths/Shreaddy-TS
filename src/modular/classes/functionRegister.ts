export class FunctionConfig {
    constructor(
        public name: string, 
        public target: new (...args: any[]) => any, 
        public propertyKey: string
    ) {}
}

export class FunctionRegister {
    actions: FunctionConfig[] = []

    get(name: string) {
        return this.actions.filter(action => action.name == name)
    }

    add(config: FunctionConfig) {
        return this.actions.push(config)
    }
}
