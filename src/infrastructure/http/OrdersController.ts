import { FastifyRequest, FastifyReply } from "fastify"
import { createOrder, deleteOrder } from "@composition/container"

export const OrdersController = {
    async create(req: FastifyRequest, reply: FastifyReply) {
        const { orderId, customerId, items } = req.body as any
        const out = await createOrder.execute({ orderId, customerId, items })
        reply.code(201).send(out)
    },

    async delete(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as any
        try {
            await deleteOrder.execute({ orderId: id })
            reply.code(204).send()
        } catch (err: any) {
            // Not found -> 404; other errors -> 500
            if (err?.message === 'Order not found') {
                reply.code(404).send({ error: err.message })
            } else {
                reply.code(500).send({ error: err?.message ?? 'Internal error' })
            }
        }
    }
}