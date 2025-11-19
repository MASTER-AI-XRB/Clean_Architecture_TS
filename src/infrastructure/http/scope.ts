import { randomUUID } from "crypto"
import type { AppContainer } from "@composition/container"
import { AddItemToOrder } from "@application/use-cases/AddItemToOrderUseCase"
import { CreateOrder } from "@application/use-cases/CreateOrderUseCase"
import { DeleteOrder } from "@application/use-cases/DeleteOrderUseCase"
import type { AppContext } from "@application/context"

export type RequestScope = ReturnType<typeof makeRequestScope>

export function makeRequestScope(c: AppContainer) {
    const requestId = randomUUID()
    const logger = c.logger.child({ requestId })

    const ctx: AppContext = {
        orders: c.ports.orders,
        pricing: c.ports.pricing,
        events: c.ports.events,
        clock: c.ports.clock,
    }

    return {
        requestId,
        logger,
        useCases: {
            createOrder: new CreateOrder(c.ports.orders, c.ports.events),
            addItemToOrder: new AddItemToOrder(ctx),
            deleteOrder: new DeleteOrder(c.ports.orders),
        },
    }
}