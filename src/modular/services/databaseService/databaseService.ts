import { combineLatest, concatAll, delay, firstValueFrom, from, lastValueFrom, merge, of, switchMap, take, tap } from "rxjs";
import { Injectable } from "../../core";
import { OnInit } from "../../hooks";
import { ConfigService } from "../configService";
import { AsyncDatabase } from "promised-sqlite3"
import { Query, QueryParams } from "./query";
import { BeforeInit } from "src/modular/classes/hooks/lifecycle";

@Injectable()
export class DatabaseService implements BeforeInit {

    private db!: AsyncDatabase
    private prefix!: string

    constructor(private config: ConfigService) {}

    beforeInit() {
        let prefix$ = this.config.take$("DB_PREFIX", "modular_").pipe(
            tap(prefix => this.prefix = prefix)
        )

        let db$ = this.config.take$("DB_FILENAME", "db.sqlite").pipe(
            switchMap(filename => from(AsyncDatabase.open(filename))),
        )

        return combineLatest([prefix$, db$]).pipe(tap(([_, db]) => this.db = db))
    }

    exec(sql: string, params: QueryParams = {}) {
        return this.db.run(sql, params)
    }

    fetch<T>(sql: string) {
        return this.db.get<T>(sql)
    }

    fetchAll<T>(sql: string) {
        return this.db.all<T>(sql)
    }

    query(table: string) {
        return new Query(this, table)
    }

    getConnexion() {
        return this.db
    }

    getPrefix() {
        return this.prefix
    }

}