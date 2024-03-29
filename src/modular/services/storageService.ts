import { Injectable } from "@modular/core";
import { BehaviorSubject, Observable, Subject, catchError, distinctUntilChanged, filter, interval, map, of } from "rxjs";

@Injectable()
export class StorageService {

    fs = require('fs')
    path = require("path")

    observeFile(path: string, defaultValue = "", checkInterval = 100): Observable<string> {
        let subject = new BehaviorSubject<string>(defaultValue)
        interval(checkInterval).subscribe()
        subject.next(this.readFile(path, subject.value))
        this.fs.watchFile(path, {interval: checkInterval}, () => {
            subject.next(this.readFile(path, subject.value))
        })

        return subject.pipe(
            distinctUntilChanged()
        )
    }

    observeJson<T = any>(path: string, defaultValue: any = {}, checkInterval = 100): Observable<T> {
        return this.observeFile(path, JSON.stringify(defaultValue), checkInterval).pipe(
            filter((str) => {
                try{
                    JSON.parse(str)
                    return true  
                }
                catch{
                    return false
                }
            }),
            map((str) => JSON.parse(str)),
        )
    }

    writeFile(path:string, value: string) {
        let dir = path.split("/")
        dir.pop()

        let pathDir = ''
        while (dir.length) {
            pathDir += dir.shift()
            if (!this.fs.existsSync(pathDir)) {
                this.fs.mkdirSync(pathDir)
            }
            pathDir += "/"
        }

        this.fs.writeFileSync(path, value)

    }

    writeJson(path: string, value: any) {
        this.writeFile(path, JSON.stringify(value, undefined, 2))
    }

    readJson(path: string, defaultValue: Object = {}) {
        if (!this.fs.existsSync(path)) {
            this.writeJson(path, defaultValue)
        }
        return JSON.parse(this.fs.readFileSync(path, { encoding: 'utf8', flag: 'r' }))
    }

    readFile(path: string, defaultValue: string) {
        if (!this.fs.existsSync(path)) {
            this.writeFile(path, defaultValue)
        }
        return this.fs.readFileSync(path, { encoding: 'utf8', flag: 'r' })
    }

    appendFile(path: string, text: string, end = '\n') {
        if (!this.fs.existsSync(path)) {
            this.writeFile(path, '')
        }
        return this.fs.appendFileSync(path, text + end, { encoding: 'utf8' } )

    }


}    