import { Observable } from "rxjs";


export function implementsOnInit(module: object): module is OnInit {
    return (<OnInit>module).onInit !== undefined;
}
export interface OnInit {
    onInit(): Observable<any> | Promise<any> | void;
}


export function implementsAfterInit(module: object): module is AfterInit {
    return (<AfterInit>module).afterInit !== undefined;
}
export interface AfterInit {
    afterInit(): Observable<any> | Promise<any> | void;
}


export function implementsBeforeUnload(module: object): module is BeforeUnload {
    return (<BeforeUnload>module).beforeUnload !== undefined;
}
export interface BeforeUnload {
    beforeUnload(): Observable<any> |  Promise<any> | void;
}


export function implementsOnUnload(module: object): module is OnUnload {
    return (<OnUnload>module).onUnload !== undefined;
}
export interface OnUnload {
    onUnload(): Observable<any> | Promise<any> |  void;
}