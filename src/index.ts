import { Modular } from "@modular/core"
import { AppModule } from "./modules/AppModule"
import { LogThemeModule } from "./modules/LogThemeModule"
import { EchoModule } from "./modules/EchoModule"

Modular.run([
    AppModule,
    LogThemeModule,
    EchoModule
])
