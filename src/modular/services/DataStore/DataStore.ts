import { Injectable } from "src/modular/core";
import { DatabaseService } from "../databaseService/databaseService";
import { Query, QueryInsertParam } from "../databaseService/query";
import { Observable, Subject, concat, concatMap, distinctUntilChanged, filter, from, map, merge, take, tap } from "rxjs";



@Injectable()
export class DataStore {

    savePipe = new Subject<{[key:string]: string | null}>()

    constructor(private db: DatabaseService) {}

    get$(key: string, distinct = true): Observable<string | null> {
        let initialValue = from(
            this.get(key)
        ).pipe(
            filter(value => value !== undefined),
            map(value => {return {[key]: <string|null>value}})
        )



        let observable = merge(initialValue, this.savePipe).pipe(
            filter(row => key in row),
            map(row => row[key])
        )

        if (distinct) {
            observable = observable.pipe(
                distinctUntilChanged()
            )
        }

        return observable
    }

    getNumber$(key: string, distinct = true): Observable<number> {
        return this.get$(key, distinct).pipe(           
            map(value => {
                if (value === null) {
                    return 0
                }
                return parseInt(value, 10)
            })
        )
    }

    take$(key: string) {
        return this.get$(key).pipe(take(1))
    }


    async get(key: string): Promise<string | null | undefined> {
        const result = await this.baseQuery()
        .select("data_store.data_value")
        .filter("data_key", key)
        .first<{data_value: string | null}>()

        return result?.data_value
    }

    async getNumber(key: string): Promise<number> {
        const result = await this.baseQuery()
        .select("data_store.data_value")
        .filter("data_key", key)
        .first<{data_value: string | null}>()

        let value = result?.data_value
        return value ? parseInt(value, 10) : 0
    }



    async save<T extends QueryInsertParam>(key: string, value: T): Promise<string | null> {
        const result = await this.get(key)
        if (result) {
            return await this.update(key, value)
        } else {
            return await this.insert(key, value)
        }
    }

    private async update<T extends QueryInsertParam>(key: string, value: T): Promise<string | null>  {
        const result = await this.baseQuery()
        .filter("data_store.data_key", key)
        .update({
            data_value: [value],
            update_date: "CURRENT_TIMESTAMP"
        })

        const safeValue = this.cast(value)
        this.toPipe(key, safeValue)
        return safeValue
    }

    private async insert<T extends QueryInsertParam>(key: string, value: T): Promise<string | null> {
        await this.db.query("data_store")        
        .insert({
            data_key: [key],
            data_value: [value]
        })

        const safeValue = this.cast(value)
        this.toPipe(key, safeValue)
        return safeValue
    }

    toPipe(key: string, value: string | null) {
        this.savePipe.next({[key]: value})
    }


    baseQuery(deleted?: boolean) {
        return this.db.query("data_store")
        .tribool("data_store.deleted_date", deleted)
    }

    cast(value: QueryInsertParam): string | null {
        return value !== null ? Query.convertToString(value) : value
    }

}