import { Modular } from "@modular/core"
import { HelloModule } from "./modules/HelloModule"
import { LogThemeModule } from "./modules/LogThemeModule"

Modular.run([
    HelloModule,
    LogThemeModule
])
