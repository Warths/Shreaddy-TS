import { Injectable } from "@modular/core";


@Injectable()
export class Tools {
    token(length: number, characters: string = "abcdefghijklmnopqrstuvwxyz1234567890"): string {
        let result = '';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
}    