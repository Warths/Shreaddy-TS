import { Modular } from "@modular/core"
import { AppModule } from "./modules/AppModule"
import { LogThemeModule } from "./modules/LogThemeModule"

Modular.run([
    AppModule,
    LogThemeModule
])
