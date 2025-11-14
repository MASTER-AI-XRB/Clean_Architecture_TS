import { OrderRepository } from "@application/ports/OrderRepository"

export type DeleteOrderInput = { orderId: string }

export class DeleteOrder {
    constructor(private readonly repo: OrderRepository) {}

    async execute({ orderId }: DeleteOrderInput): Promise<void> {
        const exists = await this.repo.findById(orderId)
        if (!exists) throw new Error('Order not found')
        await this.repo.delete(orderId)
    }
}

export default DeleteOrder
