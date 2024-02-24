import { Module } from "@modular/core";
import { map } from "rxjs";
import { ConfigService } from "src/modular/services/configService";
import { HttpServerService } from "src/modular/services/httpServerService";
import { LogService } from "src/modular/services/logService";

@Module()
export class HelloModule  {
    constructor(private log: LogService, private http: HttpServerService) {
        this.log.info("info Demo") 
        this.log.notice("notice Demo") 
        this.log.warning("warning Demo") 
        this.log.important("important Demo") 
        this.log.thirdParty("thirdParty Demo") 
        this.log.discrete("discrete Demo") 
}


}