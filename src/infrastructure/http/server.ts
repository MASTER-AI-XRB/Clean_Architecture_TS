import Fastify from "fastify"
import { MakeOrdersController } from "@infrastructure/http/controllers/OrdersController"
import { AppContainer } from "@composition/container"

export async function buildServer(c: AppContainer) {
    const app = Fastify()
    const ctrl = MakeOrdersController({
        createOrder: c.useCases.createOrder,
        addItemToOrder: c.useCases.addItemToOrder,
        deleteOrder: c.useCases.deleteOrder,
    })

    app.post("/orders", ctrl.create)
    app.post("/orders/:orderId/items", ctrl.addItem)
    app.delete("/orders/:id", ctrl.delete)
    return app
}