import { AsyncDatabase } from "promised-sqlite3";
import { DatabaseService } from "./databaseService";
import { RunResult } from "sqlite3";


export type Database = {
    getConnexion: () => AsyncDatabase,
    getPrefix: () => string
}


export type PreparedWriteParams = {
    columns: string[]
    values: string []
    params: QueryInsertParam[]
}
export type QueryInsertValidParam = string | boolean | number | null | [string] | [boolean] | [number] | [null]
export type QueryInsertParams = Record<string, QueryInsertValidParam>
export type QueryInsertParam = string | number | boolean | null
export type QueryParams = Record<string, string | boolean>
export type QueryJoinType = ""|"LEFT"|"RIGHT"|"OUTER"|"INNER"
export type Triboolean = boolean | null | undefined

export class Query {

    private _tokenCount: number = 0

    private _select: string[] = []

    private _params: QueryParams = {}
    private _wheres: string[] = []

    private _joins: string[] = []

    private _limit: number | null = null
    private _offset: number | null = null

    private _orderBy: string | null = null
    private _groupBy: string | null = null


    constructor(private db: Database, private _table: string) {}

    from(table: string): this {
        this._table = table
        return this
    }

    table(table: string): this {
        return this.from(table)
    }

    select(...columns: string[]): this {
        this._select.push(...columns)
        return this
    }

    pipe<T>(subject: T, ...callbacks: ((accumulator: T) => T)[]): T {
        return callbacks.reduce((query, fn) => fn(query), subject)
    }

    buildTotal(): string {
        return this.pipe('', 
            query => this.buildSelect(query, ["'_' as _"]),
            query => this.buildFrom(query, this._table),
            query => this.buildJoin(query, this._joins),
            query => this.buildWhere(query, this._wheres),
            query => this.buildGroupBy(query, this._groupBy),
            query => this.prepareParams(query, this._params),
        )
    }
    
    build(): string {
        return this.pipe(
            '', 
            query => this.buildSelect(query, this._select),
            query => this.buildFrom(query, this._table),
            query => this.buildJoin(query, this._joins),
            query => this.buildWhere(query, this._wheres),
            query => this.buildGroupBy(query, this._groupBy),
            query => this.buildOrderBy(query, this._orderBy),
            query => this.buildLimit(query, this._limit, this._offset),
            query => this.prepareParams(query, this._params), 
        )
    }

    buildDeleteFrom(table: string): string {
        return `DELETE FROM ${this.prefixed(table, false)}`
    }

    buildDelete(): string {
        return this.pipe(
            '',
            _ => this.buildDeleteFrom(this._table),
            query => this.buildWhere(query, this._wheres),
            query => this.prepareParams(query, this._params)
        )
    }


    async delete(where: string, params: QueryParams): Promise<RunResult>
    async delete(): Promise<RunResult>
    async delete(where?: string, params?: QueryParams): Promise<RunResult> {
        if (where) {
            this.where(where, params)
        }
        return await this.db.getConnexion().run(this.buildDelete())
    }

    buildSelect(query: string, select: string[]): string {
        return query + "SELECT " + (this._select.length ? select.join(", ") : "*")
    }

    buildFrom(query: string, table: string): string {
        return query + " FROM " + this.prefixed(table)
    }

    buildJoin(query: string, joins: string[]): string {
        return joins.reduce((query, join) => query + join, query)
    }

    buildWhere(query: string, wheres: string[]): string {
        return wheres.reduce((query, where, i) => query + ( i ? " AND " : " WHERE ") + where, query)
    }

    buildGroupBy(query: string, groupBy: string | null): string {
        if (groupBy) {
            return query + " GROUP BY " + groupBy
        }
        return query

    }

    buildOrderBy(query: string, orderBy: string | null): string {
        if (orderBy) {
            return query + " ORDER BY " + orderBy
        }
        return query
    }

    buildLimit(query: string, limit: number | null, offset: number | null): string {
        if (limit === null) {
            return query
        }


        query += " LIMIT " + limit 
        if (offset === null) {
            return query
        }

        return query + " OFFSET " + offset

    }

    prepareParams(query: string, params: QueryParams) {
        for(let key in params) {
            let param_value = this._params[key]
            if (typeof param_value === "boolean") {
                param_value = param_value ? "1" : "0"
            }
            query = query.replace(":"+key, this.quote(param_value))
        }
        return query
    }


    prefixed(name: string, withAlias = true): string {
        return `${this.db.getPrefix()}${name}` + withAlias ? name : ""
    }

    limit(limit: number | null, offset: number | null = null): this {
        this._limit = limit
        this._offset = offset
        return this
    }

    page(page: number, pageLength: number | null = null): this {
        if (!pageLength) {
            return this
        }
        return this.limit(pageLength, (page-1)*pageLength)
    }

    where(condition: string, params: QueryParams = {}): this {
        this._wheres.push(condition)
        return this.addParams(params)
    }

    addParams(params: QueryParams = {}): this {
        this._params = Object.assign(this._params, params)
        return this
    }

    bind(params: QueryParams): this {
        return this.addParams(params)
    }

    and(condition: string, params: QueryParams = {}): this {
        return this.where(condition, params)
    }

    not(condition: string, params: QueryParams = {}): this {
        return this.where("NOT " + condition, params)
    }

    filter(column: string, value:string, operator = "="): this {
        const token = this.createToken() 
        let params: QueryParams = {}
        params[token] = value
        return this.where(`${column} ${operator} :${token}`, {[token]:value})
    }

    filterOut(column: string, value:string, operator = "="): this {
        const token = this.createToken() 
        let params: QueryParams = {}
        params[token] = value
        return this.not(`${column} ${operator} :${token}`, params)
    }


    like(column: string, value: string): this {
        return this.filter(column, value, "LIKE")
    }

    createToken(name = "t"): string {
        const token = name + this._tokenCount.toString()
        this._tokenCount++
        return token
    }

    orderBy(clause: string | null): this {
        this._orderBy = clause
        return this
    }

    groupBy(clause: string | null): this {
        this._groupBy = clause
        return this
    }

    whereIn(column: string, array: string[]): this {
        return this.where(this.makeWhereIn(column, array))
    }

    whereNotIn(column: string, array: string[]): this {
        return this.where(this.makeWhereNotIn(column, array)) 
    }

    makeWhereIn(column: string, array: string[]): string {
        return array.length ? (column + " IN " + this.prepareArray(array)) : "false"
    }

    makeWhereNotIn(column: string, array: string[]): string {
        return array.length ? (column + " NOT IN " + this.prepareArray(array)) : "true"
    }

    prepareArray(array: string[]): string {
        let string = ""
        array.forEach(
            (item, i) => {
                string += this.quote(item)
                if (i != array.length-1) {
                    string+=','
                }
            }
        )
        return `(${string})`
    }

    whereAny(conditions: string[], params: QueryParams = {}): this {
        return this.where(this.buildWhereAny(conditions), params)
    }

    whereAll(conditions: string[], params: QueryParams = {}): this {
        return this.where(this.buildWhereAll(conditions), params)
    }

    buildWhereAny(conditions: string[]): string {
        return "(" + conditions.join(" OR ") + ")"
    }

    buildWhereAll(conditions: string[]): string {
        return "(" + conditions.join(" AND ") + ")"
    }

    isNull(column: string): this {
       return this.whereAny([column + " IS NULL", "NOT " + column])
    }
    
    isNotNull(column: string): this {
        return this.whereAll([column + " IS NOT NULL", column])
    }

    expired(column: string, tribool: Triboolean = true): this {
        if (tribool === null || tribool === undefined) {
            return this
        }

        if (tribool) {
            return this.where(column + " < NOW()")
        }

        return this.whereAny([column + " > NOW()", column + " IS NULL"])
    }

    tribool(column: string, tribool: Triboolean): this {
        if (tribool === null || tribool === undefined) {
            return this
        }

        if (tribool) {
            return this.isNotNull(column)
        }
        return this.isNull(column)
    }

    search(searchTerms: string, columns: string[] | string, start="%", end="%"): this {
        if (typeof columns == "string") {
            columns = [columns] 
        }

        if (!searchTerms.length) {
            return this
        }

        const token = this.createToken()
        const conditions = columns.map(column => column + " LIKE :" + token)

        return this.whereAny(conditions, {[token]: start+searchTerms+end})
    }

    join(table: string, condition: string = "TRUE", params: QueryParams = {}, type: QueryJoinType = ""): this {
        table = this.prefixed(table, !table.includes(" as "))
        this.addParams(params)
        this._joins.push(`${type} JOIN ${table} ON ${condition}`)
        return this
    }

    leftJoin(table: string, condition: string = "TRUE", params: QueryParams = {}): this {
        return this.join(table, condition, params, "LEFT")
    }

    rightJoin(table: string, condition: string = "TRUE", params: QueryParams = {}): this {
        return this.join(table, condition, params, "RIGHT")
    }

    makeSubQuery(tableName: string): string {
        return `(${this.build()}) as ${tableName}`
    }

    orderByQuery(order: string): string {
        return `(${this.build()}) as ${order}`
    }

    async total() {
        let result = await this.db.getConnexion().all(this.buildTotal())
        return result.length
    }

    async first<T>(): Promise<T | undefined> {
        return this.db.getConnexion().get<T>(this.build())
    }

    async all<T>() {
        return this.db.getConnexion().all<T>(this.build())
    }

    buildInsertQuery(table: string): string {
        return "INSERT INTO " + this.prefixed(table, false)
    }

    buildInsertColumns(query: string, values: string[]): string {
        return  `${query} (${values.join(', ')})`
    }

    buildInsertValues(query: string, values: string[]): string {
        return `${query} VALUES (${values.join(', ')});`
    }

    insert(params:QueryInsertParams) {
        const preparedParams = this.prepareWriteParams(params)
        
        return this.db.getConnexion().run(this.insertQuery(preparedParams.columns, preparedParams.values), preparedParams.params)
    }

    insertQuery(columns: string[], values: string[]): string {
        return this.pipe(
            '',
            _ => this.buildInsertQuery(this._table),
            query => this.buildInsertColumns(query, columns),
            query => this.buildInsertValues(query, values)
        )
    }

    buildUpdateQuery(table: string): string {
        return "UPDATE " + this.prefixed(table, false)
    } 

    buildUpdateSet(query: string, columns: string[], values: string[]) {
        const sets = columns.map((column, i) => `${column} = ${values[i]}`)
        return query + " SET " + sets.join(", ")
    }

    update(params:QueryInsertParams) {
        const preparedParams = this.prepareWriteParams(params)
        return this.db.getConnexion().run(this.updateQuery(preparedParams.columns, preparedParams.values), preparedParams.params)
    }

    updateQuery(columns: string[], values: string[]): string {
        return this.pipe(
            '',
            _ => this.buildUpdateQuery(this._table),
            query => this.buildUpdateSet(query, columns, values),
            query => this.buildWhere(query, this._wheres),
            query => this.prepareParams(query, this._params),

        )
    }


    prepareWriteParams(params: QueryInsertParams): PreparedWriteParams {
        const prepared: PreparedWriteParams = {
            columns: [],
            values: [],
            params: []
        }

        for(let [column, value] of Object.entries(params)) {
            prepared.columns.push(column)

            if (value === null || (Array.isArray(value) && value[0] === null)) {
                value = "NULL"
            }

            value ??= [""]

            if (Array.isArray(value)) {
                prepared.values.push("?")
                prepared.params.push(this.convertToString(value[0]))
            } else {
                prepared.values.push(this.convertToString(value))
            }
        }

        return prepared

    }

    convertToString(toConvert: string | boolean | number) {
        switch (typeof toConvert) {
            case "boolean":
                return toConvert ? "1" : "0"
            case "number":
                return toConvert.toString(10)
        }
        return toConvert
    }

    quote(value: string) {
        return "'"+value
            .replace(/\\/g, "\\\\") 
            .replace(/\'/g, "\\'")
            .replace(/\"/g, "\\\"") 
            .replace(/\n/g, "\\n") 
            .replace(/\r/g, "\\r") 
            .replace(/\x00/g, "\\0") 
            .replace(/\x1a/g, "\\Z")+"'"
    }


}