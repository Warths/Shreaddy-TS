import { Module } from "@modular/core";
import { HelloService } from "src/services/HelloService";

@Module()
export class HelloModule {
    constructor(private helloService: HelloService) {}
}