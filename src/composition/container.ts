import { loadConfig } from "./config"
import { InMemoryOrderRepository } from "@infrastructure/persistence/InMemoryOrderRepository"
import { PostgresOrderRepository } from "@infrastructure/persistance/postgres/PostgresOrderRepository"
import { HttpPricingService } from "@infrastructure/http/HttpPricingService"
import { OutboxEventBus } from "@infrastructure/messaging/OutboxEventBus"
import { PinoLogger } from "@infrastructure/observability/PinoLogger"
import { AddItemToOrder } from "@application/use-cases/AddItemToOrderUseCase"
import { CreateOrder } from "@application/use-cases/CreateOrderUseCase"
import { DeleteOrder } from "@application/use-cases/DeleteOrderUseCase"
import { Pool } from "pg"


//const env = process.env
//const pool = new Pool({ connectionString: env.DATABASE_URL })
//const orders = 
//env.USE_INMEMORY === "true"
    //? new InMemoryOrderRepository()
    //: new PostgresOrderRepository(pool)
//const pricing = new HttpPricingService(env.PRICING_SERVICE_URL ?? "http://localhost:4000")
//const events = new OutboxEventBus(pool)



//export const logger = new PinoLogger()
//export const addItemToOrder = new AddItemToOrder(orders, pricing, events, { now: () => new Date() })

export function buildContainer() {
    const cfg = loadConfig()
    const logger = new PinoLogger()

    const pool = cfg.USE_INMEMORY === "true" ? null : new Pool({ connectionString: cfg.DATABASE_URL})
    const orders = cfg.USE_INMEMORY === "true" ? new InMemoryOrderRepository() : new PostgresOrderRepository(pool!)
    const pricing = new HttpPricingService(cfg.PRICING_SERVICE_URL)
    const events = cfg.USE_INMEMORY === "true" ? {publish: async () => {} } : new OutboxEventBus(pool!)
    const clock = { now: () => new Date()}

    const createOrder = new CreateOrder(orders, events)
    const addItemToOrder = new AddItemToOrder(orders, pricing, events, clock)

    return {
        cfg, logger, pool,
        ports: { orders, pricing, events, clock },
        useCases: { createOrder, addItemToOrder }
    }
}

export type AppContainer = ReturnType<typeof buildContainer>