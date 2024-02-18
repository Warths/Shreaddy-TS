import { Injectable } from "@modular/core";
import { HelloAgainService } from "./HelloSubService";
import { OnInit } from "src/modular/hooks";
import { Action } from "src/modular/classes/hooks/action";

@Injectable()
export class HelloService {

    constructor(private helloAgainService: HelloAgainService) {}

    @Action(HelloService, 'test')
    sayHello() {
        console.log(this)
        this.sayGoodBye()
    }

    sayGoodBye() {
        console.log("goodbye")
    }

}