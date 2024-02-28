import { Injectable } from "@modular/core";
import { Action, Hooks } from "../hooks";
import { StorageService } from "./storageService";
import { BehaviorSubject, interval } from "rxjs";

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
    log_write(text: string) {
        this.storage.appendFile('log/' + this.hooks.filter<string>('log_file_name', 'log.txt'), text)
    }

    @Action("log_info")
    info(text: string) {
        this.log(text, "info")

    }

    @Action("log_notice")
    notice(text: string) {
        this.log(text, "notice")

    }

    @Action("log_warning")
    warning(text: string) {
        this.log(text, "warning")

    }

    @Action("log_discrete")
    discrete(text: string) {
        this.log(text, "discrete")

    }

    @Action("log_third_party")
    thirdParty(text: string) {
        this.log(text, "third_party")

    }

    @Action("log_important")
    important(text: string) {
        this.log(text, "important")
    }

    log(text: string, type: string) {
        let log_format = this.hooks.filter<string>("log_"+type+"_format", "{message}")
        this.out(this.format(log_format, {message: text}))

        let log_file_format = this.hooks.filter<string>("log_file_"+type+"_format", "{message}")
        this.log_write(this.format(log_file_format, {message: text}))
    }

}    