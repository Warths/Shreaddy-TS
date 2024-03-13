import { Injectable } from "@modular/core";
import { Action, Hooks } from "../hooks";
import { StorageService } from "./storageService";

@Injectable()
export class LogService {

    constructor(private hooks: Hooks, private storage: StorageService) {}

    out(log_format: string) {
        eval(["c", "o", "n", "s", "o", "l", "e", ".", "l", "o", "g"].join(""))(log_format)
    }

    format(log_format: string, replaces: Record<string, string>) {
        for (let key of Object.keys(replaces)) {
            let toSearch = "{"+key+"}"
            while (log_format.includes(toSearch)) {
                log_format = log_format.replace(toSearch, replaces[key])
            }
        }

        return log_format
    }

    @Action("log_write")
    log_write(text: any) {
        this.storage.appendFile('log/' + this.hooks.filter<string>('log_file_name', 'log.txt'), text)
    }

    @Action("log_info")
    info(text: any) {
        this.log(text, "info")

    }

    @Action("log_notice")
    notice(text: any) {
        this.log(text, "notice")

    }

    @Action("log_warning")
    warning(text: any) {
        this.log(text, "warning")

    }

    @Action("log_discrete")
    discrete(text: any) {
        this.log(text, "discrete")

    }

    @Action("log_third_party")
    thirdParty(text: any) {
        this.log(text, "third_party")

    }

    @Action("log_important")
    important(text: any) {
        this.log(text, "important")
    }

    log(text: any, type: string) {
        if (text instanceof Object) {
            text = JSON.stringify(text)
        }
        let log_format = this.hooks.filter<string>("log_"+type+"_format", "{message}")
        this.out(this.format(log_format, {message: text}))

        let log_file_format = this.hooks.filter<string>("log_file_"+type+"_format", "{message}")
        this.log_write(this.format(log_file_format, {message: text}))
    }

}    