import { describe, it, expect, beforeEach, vi } from "vitest"
import { AddItemToOrder } from "@application/use-cases/AddItemToOrderUseCase"
import { InMemoryOrderRepository } from "@infrastructure/persistence/InMemoryOrderRepository"
import { Order } from "@domain/entities/Order"
import { PricingService } from "@application/ports/PricingService"
import { EventBus } from "@application/ports/EventBus"
import { Clock } from "@application/ports/Clock"
import { Price } from "@domain/value-objects/Price"
import { AppContext } from "@application/context"

describe("AddItemToOrder use case", () => {
    let repo: InMemoryOrderRepository
    let pricing: PricingService
    let events: EventBus
    let clock: Clock
    let ctx: AppContext

    beforeEach(() => {
        repo = new InMemoryOrderRepository()
        pricing = {
            getCurrentPrice: vi.fn().mockResolvedValue(Price.create(5, "EUR")),
        }
        events = {
            publish: vi.fn().mockResolvedValue(undefined),
        }
        clock = {
            now: vi.fn(() => new Date("2023-01-01T00:00:00.000Z")),
        }
        ctx = { orders: repo, pricing, events, clock }
    })

    it("afegeix un ítem a una comanda existent i retorna el total actualitzat", async () => {
        const order = Order.create({
            id: "order-1",
            customerId: "cust-1",
            items: [
                {
                    productId: "prod-1",
                    name: "Widget",
                    quantity: 1,
                    unitPrice: 10,
                },
            ],
        })
        await repo.save(order)

        const useCase = new AddItemToOrder(ctx)

        const result = await useCase.execute({
            orderId: "order-1",
            sku: "prod-2",
            qty: 2,
            currency: "EUR",
        })

        expect(result.ok).toBe(true)
        if (!result.ok) return

        expect(result.value.orderId).toBe("order-1")
        expect(result.value.total.amount).toBe(10 + 2 * 5)
        expect(result.value.total.currency).toBe("EUR")
        expect(pricing.getCurrentPrice).toHaveBeenCalledWith("prod-2", "EUR")
        expect(events.publish).toHaveBeenCalledTimes(1)
    })

    it("retorna error de validació si l'input és invàlid", async () => {
        const useCase = new AddItemToOrder(ctx)

        const result = await useCase.execute({
            orderId: "",
            sku: "x",
            qty: 0,
            currency: "GBP",
        })

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.error.type).toBe("validation")
        expect(result.error.details).toBeDefined()
    })

    it("retorna not_found si la comanda no existeix", async () => {
        const useCase = new AddItemToOrder(ctx)

        const result = await useCase.execute({
            orderId: "missing-order",
            sku: "prod-1",
            qty: 1,
            currency: "EUR",
        })

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.error.type).toBe("not_found")
        expect(result.error.resource).toBe("order")
    })
})


