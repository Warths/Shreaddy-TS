import { Injectable } from "src/modular/core";
import { OnInit } from "src/modular/hooks";
import { DatabaseService } from "../databaseService/databaseService";
import { QueryInsertParam } from "../databaseService/query";

@Injectable()
export class DataStore  {

    constructor(private db: DatabaseService) {}

    async get(key: string): Promise<string | undefined> {
        const result = await this.baseQuery()
        .select("data_store.data_value")
        .filter("data_key", key)
        .first<{data_value: string}>()

        return result?.data_value

    }

    async save<T extends QueryInsertParam>(key: string, value: T): Promise<T> {
        const result = await this.get(key)

        if (result) {
            return await this.update(key, value)
        } else {
            return await this.insert(key, value)
        }
    }

    private async update<T extends QueryInsertParam>(key: string, value: T): Promise<T>  {
        const result = await this.baseQuery()
        .filter("data_store.data_key", key)
        .update({
            data_value: [value]
        })


        return value
    }

    private async insert<T extends QueryInsertParam>(key: string, value: T): Promise<T> {
        await this.db.query("data_store")        
        .insert({
            data_key: [key],
            data_value: [value]
        })

        return value
    }



    baseQuery(deleted?: boolean) {
        return this.db.query("data_store")
        .tribool("data_store.deleted_date", deleted)
    }

}