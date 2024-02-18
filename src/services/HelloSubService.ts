import { Injectable } from "@modular/core";

@Injectable()
export class HelloAgainService {
    sayHelloAgain() {
        console.log("Hello again !");
    }
}