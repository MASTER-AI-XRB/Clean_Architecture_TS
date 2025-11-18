import { describe, it, expect, beforeEach } from "vitest"
import { AddItemToOrder } from "@application/use-cases/AddItemToOrderUseCase"
import { InMemoryOrderRepository } from "@infrastructure/persistence/InMemoryOrderRepository"
import { Order } from "@domain/entities/Order"

describe("AddItemToOrder use case", () => {
    let repo: InMemoryOrderRepository

    beforeEach(() => {
        repo = new InMemoryOrderRepository()
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

        const useCase = new AddItemToOrder(repo)

        const result = await useCase.execute({
            orderId: "order-1",
            sku: "prod-2",
            qty: 2,
            currency: "EUR",
            unitPrice: 5,
        })

        expect(result.ok).toBe(true)
        if (!result.ok) return

        expect(result.value.orderId).toBe("order-1")
        expect(result.value.total.amount).toBe(10 + 2 * 5)
        expect(result.value.total.currency).toBe("EUR")
    })

    it("retorna error de validació si l'input és invàlid", async () => {
        const useCase = new AddItemToOrder(repo)

        const result = await useCase.execute({
            orderId: "",
            sku: "x",
            qty: 0,
            currency: "GBP",
            unitPrice: -1,
        } as any)

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.error.type).toBe("ValidationError")
        expect(result.error.details).toBeDefined()
    })

    it("retorna not_found si la comanda no existeix", async () => {
        const useCase = new AddItemToOrder(repo)

        const result = await useCase.execute({
            orderId: "missing-order",
            sku: "prod-1",
            qty: 1,
            currency: "EUR",
            unitPrice: 10,
        })

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.error.type).toBe("not_found")
        expect(result.error.resource).toBe("order")
    })
})


