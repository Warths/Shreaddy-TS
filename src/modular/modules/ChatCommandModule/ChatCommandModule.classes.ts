import { ValidatedControls, ValidationErrors, ValidatorFn } from "./ChatCommandModule.types";

export class Validators {
    static min(minValue: number): ValidatorFn {
        return (value: string | number) => {
            value = parseFloat(value?.toString())
            return value >= minValue ? null : {min: {minValue, actualValue: value}}
        };
    }

    static max(maxValue: number): ValidatorFn {
        return (value: string | number) => {
            value = parseFloat(value?.toString())
            return value <= maxValue ? null : {max: {maxValue, actualValue: value}}
        };
    }

    static required(): ValidatorFn {
        return (value: any) => !(value === undefined || value === "") ? null : {required: true}
    }

    static choices(choices: string[]): ValidatorFn {
        return (value: any) => choices.includes(value) ? null : {choices}
    }

}



export class CommandControl<T = string> {
    constructor(public value: T, public validators: ValidatorFn[] = []) {}

    validate(value: any): ValidationErrors[] {
        return <ValidationErrors[]> this.validators.map(validator => validator(value)).filter(result => result !== null);
    }

    findMatchIndex(key: string, possibleMatches: any[]) {
        return possibleMatches.findIndex(v => !this.validate(v).length)
    }

    isValidIndex(i: number) {
        return true
    }

    translateIndex(i: number, possibleMatches: string[]) {
        if (i === -1) {
            return this.value
        } else {
            return possibleMatches[i]
        }
    }
}

export class CommandControlRequired extends CommandControl<string> {
    constructor(validators: ValidatorFn[] = []) {
        validators.unshift(Validators.required())
        super("", validators);
    }

    isValidIndex(i: number) {
        return i > -1
    }
}

export class CommandFlag extends CommandControl<boolean> {
    constructor() {
        super(false, [])
    }

    findMatchIndex(key: string, possibleMatches: string[]) {
        return possibleMatches.findIndex((v) => v.toLowerCase() === "*" + key.toLowerCase())
    }

    isValidIndex(i: number) {
        return true
    }

    translateIndex(i: number, possibleMatches: string[]) {
        return i > -1
    }

}

export class CommandRemain extends CommandControl<string> {
    constructor(validators: ValidatorFn[] = []) {
        super("", validators);
    }

    remainIsValid( argsIndex: number[]) {
        for (let i = 0; i < argsIndex.length - 1; i++) {
            if (argsIndex[i + 1] - argsIndex[i] !== 1) {
                // If the difference between current and next is not 1, they are not successive
                return false;
            }
        }
        return true;
    }

}

export class CommandParser<Controls extends Record<string, CommandControl<any>>> {
    constructor(private controls: Controls = {} as Controls, private separator = " ") {}

    getControl<K extends keyof Controls>(key: K): Controls[K] {
        return this.controls[key];
    }

    valid(rawArgs: string) {
        return this.value(rawArgs) !== null
    }

    uValue(rawArgs: string) {
        return <ValidatedControls<Controls>> this.value(rawArgs)
    }

    value(rawArgs: string) {
        let formValues: any = {
            all: rawArgs
        }
        let error = false
        let argSplit = rawArgs.split(this.separator)
        let argIndexes = argSplit.map((v, i) => i)

        for (const key in this.controls) {

            if (this.controls[key] instanceof CommandRemain) {
                continue
            }

            let index = this.controls[key].findMatchIndex(key, argSplit)
            
            if (this.controls[key].isValidIndex(index)) {
                formValues[key] = this.controls[key].translateIndex(index, argSplit)
                if (index < 0) {
                    continue
                }
                argSplit.splice(index, 1)
                argIndexes.splice(index, 1)

            } else {
                error = true
            }
        }

        for (const key in this.controls) {
            let control = this.controls[key]
            if (control instanceof CommandRemain) {
                control as CommandRemain
                if (control.remainIsValid(argIndexes)) {
                    let value = argSplit.join(this.separator)
                    if (control.validate(value).length == 0) {
                        formValues[key] = value
                    } else {
                        error = true 
                    }
                } else {
                    error = true
                }
            }
        }

        if (error) {
            return null
        } 
        return <ValidatedControls<Controls> & {all: string}>  formValues
    }
}
