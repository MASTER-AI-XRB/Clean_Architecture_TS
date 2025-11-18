import { FastifyRequest, FastifyReply } from "fastify"
import { createOrder, deleteOrder } from "@composition/container"
import { AddItemToOrder } from "@application/use-cases/AddItemToOrderUseCase"
import { AppError } from "@application/errors"

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

export const MakeOrdersController = (uc: AddItemToOrder) => ({
    addItem: async (req: FastifyRequest, reply: FastifyReply) => {
        const body = req.body as any
        const res = await uc.execute({
            orderId: (req.params as any) as string,
            sku: body.sku as string,
            qty: body.qty as number,
            currency: body.currency as string,
            unitPrice: body.unitPrice as number,
        })
        if (!res.ok) {
            const { status, body } = mapAppErrorToHttp(res.error)
            return reply.code(status).send(body)
        }
        return reply.code(200).send(res.value)
    }
})

type ErrorResponse = { status: number; body: AppError }

function mapAppErrorToHttp(e: AppError): ErrorResponse {
    switch (e.type) {
        case "validation": 
            return { status: 400, body: e }
        case "not_found": 
            return { status: 404, body: e }
        case "conflict": 
            return { status: 409, body: e }
        case "infrastructure": 
            return { status: 500, body: e }
        default: 
            return { status: 503, body: e }
    }
}