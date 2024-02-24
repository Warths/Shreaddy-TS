import { Observable, lastValueFrom } from "rxjs"

export class Tickable {

    private lastRun: number = 0
    private alives: Promise<any>[] = [

    ]
    constructor(
        public frequency: number,
        public maxAlive: number,
        public target: new (...args: any[]) => any, 
        public propertyKey: string
    ) {}

    shouldRun() {
        return Date.now() > this.lastRun + 1000 / this.frequency
    }

    canRun() {
        return this.alives.length < this.maxAlive
    }
    
    run(result: void | Promise<any> | Observable<any>) {
        if (result instanceof Observable) {
            result = lastValueFrom(result)
        }

        if (result) {
            this.alives.push(result)
            result.finally(
                () => this.alives.splice(this.alives.indexOf(result as Promise<any>), 1)                
            )
        }

        this.lastRun = Date.now()
    }
}

export class TickableRegister {
    tickables: Tickable[] = []

    add(tickable: Tickable) {
        this.tickables.push(tickable)
    }

    getReadyTickables(): Tickable[] {
        let tickables: Tickable[] = []
        for(let tickable of this.tickables) {
            if (tickable.shouldRun() && tickable.canRun()) {
                tickables.push(tickable)
            }
        }
        return tickables
    }
}
