import Fastify from "fastify"
import { OrdersController } from "@infrastructure/http/controllers/OrdersController"

export async function buildServer() {
    const app = Fastify()
    app.post('/orders', OrdersController.create)
    app.delete("/orders/:id", OrdersController.delete)
    return app
}