import { AddItemToOrderInput, AddItemToOrderOutput } from "@application/dtos/AddItemToOrderDTO"
import { AppError, ValidationError, NotFoundError } from "@application/errors"
import { OrderRepository } from "@application/ports/OrderRepository"
import { OrderItemProps } from "@domain/entities/Order"
import { Result, ok, fail } from "@shared/result"

export class AddItemToOrder {
    constructor (private readonly repo: OrderRepository) {}

    async execute (input: AddItemToOrderInput & { unitPrice: number }): Promise<Result<AddItemToOrderOutput, AppError>> {
        const validated = this.validate(input)
        if (!validated.ok) {
            return fail(validated.error)
        }

        try {
            const { orderId, sku, qty, currency, unitPrice } = validated.value

            const existing = await this.repo.findById(orderId)
            if (!existing) {
                const notFound: NotFoundError = {
                    type: "not_found",
                    resource: "order",
                    id: orderId,
                }
                return fail(notFound)
            }

            const item: OrderItemProps = {
                productId: sku,
                name: sku,
                quantity: qty,
                unitPrice,
            }

            existing.addItem(item)
            await this.repo.save(existing)

            const output: AddItemToOrderOutput = {
                orderId: existing.id,
                total: {
                    amount: existing.total,
                    currency,
                },
            }

            return ok(output)
        } catch (e) {
            const err: ValidationError = {
                type: "ValidationError",
                message: (e as Error).message,
            }
            return fail(err)
        }
    }

    private validate (input: AddItemToOrderInput & { unitPrice: number }): Result<AddItemToOrderInput & { unitPrice: number }, ValidationError> {
        const errors: Record<string, string> = {}

        if (!input.orderId || typeof input.orderId !== "string" || input.orderId.trim().length === 0) {
            errors.orderId = "Required"
        }

        if (!input.sku || !/^[A-Za-z0-9-]{3,30}$/.test(input.sku)) {
            errors.sku = "Invalid SKU format"
        }

        if (!Number.isInteger(input.qty) || input.qty <= 0) {
            errors.qty = "Quantity must be a positive integer"
        }

        if (!["EUR", "USD"].includes(input.currency)) {
            errors.currency = "Unsupported currency"
        }

        if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
            errors.unitPrice = "Unit price must be a non-negative number"
        }

        if (Object.keys(errors).length > 0) {
            return fail({
                type: "ValidationError",
                message: "Invalid input",
                details: errors,
            })
        }

        return ok(input)
    }
}


