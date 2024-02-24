import { Injectable } from "@modular/core";
import { BehaviorSubject, Observable, distinctUntilChanged, interval } from "rxjs";
import { ConfigService } from "./configService";

@Injectable()
export class HttpServerService {

    http = require('http')
    url = require("url")

    port!: number
    addr!: string

    constructor(private config: ConfigService) {}

    onInit() {
        this.config.get$("HTTP_SERVER_PORT", 4987).subscribe(
            port => this.setPort(port)
        )

        this.config.get$("HTTP_SERVER_ADDR", "127.0.0.1").subscribe(
            addr => this.setAddr(addr)
        )
    }

    setPort(port: number) {
        this.port = port
        this.config.set("HTTP_SERVER_PORT", port)
    }

    setAddr(addr: string) {
        this.addr = addr
        this.config.set("HTTP_SERVER_ADDR", addr)
    }

}    