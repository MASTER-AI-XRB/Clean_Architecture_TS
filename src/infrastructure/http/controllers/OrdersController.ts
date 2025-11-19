import { FastifyRequest, FastifyReply } from "fastify"
import { AddItemToOrder } from "@application/use-cases/AddItemToOrderUseCase"
import { CreateOrder } from "@application/use-cases/CreateOrderUseCase"
import { DeleteOrder } from "@application/use-cases/DeleteOrderUseCase"
import { AppError } from "@application/errors"

export const MakeOrdersController = (deps: {
    createOrder: CreateOrder
    addItemToOrder: AddItemToOrder
    deleteOrder: DeleteOrder
}) => ({
    create: async (req: FastifyRequest, reply: FastifyReply) => {
        const { orderId, customerId, items } = req.body as any
        const out = await deps.createOrder.execute({ orderId, customerId, items })
        reply.code(201).send(out)
    },
    addItem: async (req: FastifyRequest, reply: FastifyReply) => {
        const body = req.body as any
        const res = await deps.addItemToOrder.execute({
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
    },
    delete: async (req: FastifyRequest, reply: FastifyReply) => {
        const { id } = req.params as any
        try {
            await deps.deleteOrder.execute({ orderId: id })
            reply.code(204).send()
        } catch (err: any) {
            if (err?.message === "Order not found") {
                reply.code(404).send({ error: err.message })
            } else {
                reply.code(500).send({ error: err?.message ?? "Internal error" })
            }
        }
    },
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