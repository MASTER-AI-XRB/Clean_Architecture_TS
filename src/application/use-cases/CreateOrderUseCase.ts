import { Order, OrderItemProps } from "@domain/entities/Order"
import { OrderRepository } from "@application/ports/OrderRepository"
import { EventBus } from "@application/ports/EventBus"
import { DomainEvent } from "@domain/events"

export type CreateOrderInput = { orderId?: string; customerId: string; items: OrderItemProps[] }
export type CreateOrderOutput = { orderId: string }

export class CreateOrder {
    constructor (
        private readonly repo: OrderRepository,
        private readonly events: EventBus,
    ) {}

    async execute({ orderId, customerId, items }: CreateOrderInput): Promise<CreateOrderOutput> {
        if (orderId) {
            const exists = await this.repo.findById(orderId)
            if (exists) throw new Error("Order already exists")
        }

        const props: any = { customerId, items }
        if (orderId) props.id = orderId

        const order = Order.create(props)
        await this.repo.save(order)
        await this.events.publish([this.makeEvent("order.created", order)])
        return { orderId: order.id }    
    }

    private makeEvent(type: string, order: Order): DomainEvent {
        return {
            type,
            occurredAt: new Date(),
            payload: order.toPrimitives(),
        }
    }
}