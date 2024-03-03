import { Injectable } from "@modular/core";
import { combineLatest } from "rxjs";
import { ConfigService } from "./configService";

import express, { Request, Response } from 'express';
import { Server } from "http";
import { LogService } from "./logService";

const { exec } = require('child_process');

const opn = require('opn')

@Injectable()
export class HttpServerService {

    app = express()

    get = this.app.get.bind(this.app)
    put = this.app.put.bind(this.app)
    post = this.app.post.bind(this.app)
    patch = this.app.patch.bind(this.app)
    delete = this.app.delete.bind(this.app)
    options = this.app.options.bind(this.app)


    server?: Server
    port!: number
    addr!: string


    constructor(private config: ConfigService, private log: LogService) {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    onInit() {
        combineLatest([
            this.config.get$("HTTP_SERVER_ADDR", "127.0.0.1"),
            this.config.get$("HTTP_SERVER_PORT", 4987),
        ]).subscribe(
            ([addr, port]) => {
                this.port = port
                this.addr = addr

                if (this.server) {
                    this.closeServer("Closing server.")
                }
                this.server = this.app.listen(port, addr, () => {
                    this.log.notice(`Opened HTTP Server on ${addr}:${port}`)
                })
            }
            
        )

    }

    setPort(port: number) {
        this.config.set("HTTP_SERVER_PORT", port)
    }

    setAddr(addr: string) {
        this.config.set("HTTP_SERVER_ADDR", addr)
    }

    closeServer(message: string) {
        if (!this.server) {
            this.log.warning("Tried to close a server that doesn't exist")
            return 
        }

        this.server.close(() => {
            this.log.notice(message)
        })
        this.server = undefined
    }

    openInBrowser(url: string) {
        if (!url.startsWith("http")) {
            url = `http://${this.addr}:${this.port}${url}`
        }
        opn(url)


    } 
}     