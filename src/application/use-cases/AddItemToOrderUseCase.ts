import { AddItemToOrderInput, AddItemToOrderOutput } from "@application/dtos/AddItemToOrderDTO"
import { AppError, ValidationError, NotFoundError } from "@application/errors"
import { AppContext } from "@application/context"
import { OrderItemProps } from "@domain/entities/Order"
import { DomainEvent } from "@domain/events"
import { Result, ok, fail } from "@shared/result"

export class AddItemToOrder {
    constructor (private readonly ctx: AppContext) {}

    async execute (input: AddItemToOrderInput & { unitPrice?: number }): Promise<Result<AddItemToOrderOutput, AppError>> {
        const validated = this.validate(input)
        if (!validated.ok) {
            return fail(validated.error)
        }

        try {
            const { orderId, sku, qty, currency } = validated.value

            const existing = await this.ctx.orders.findById(orderId)
            if (!existing) {
                const notFound: NotFoundError = {
                    type: "not_found",
                    resource: "order",
                    id: orderId,
                }
                return fail(notFound)
            }

            const unitPriceResult = await this.resolveUnitPrice(validated.value)
            if (!unitPriceResult.ok) {
                return fail(unitPriceResult.error)
            }

            const item: OrderItemProps = {
                productId: sku,
                name: sku,
                quantity: qty,
                unitPrice: unitPriceResult.value,
            }

            existing.addItem(item)
            await this.ctx.orders.save(existing)

            await this.ctx.events.publish([
                this.makeEvent("order.item_added", {
                    orderId: existing.id,
                    sku,
                    qty,
                    unitPrice: unitPriceResult.value,
                    total: existing.total,
                }),
            ])

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
                type: "validation",
                message: (e as Error).message,
            }
            return fail(err)
        }
    }

    private async resolveUnitPrice (input: AddItemToOrderInput & { unitPrice?: number }): Promise<Result<number, ValidationError>> {
        if (input.unitPrice !== undefined) {
            if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
                return fail({
                    type: "validation",
                    message: "Invalid input",
                    details: { unitPrice: "Unit price must be a non-negative number" },
                })
            }
            return ok(input.unitPrice)
        }

        try {
            const fetched = await this.ctx.pricing.getCurrentPrice(input.sku as any, input.currency as any)
            if (!fetched) {
                return fail({
                    type: "validation",
                    message: "Price not available for sku/currency",
                    details: { price: "Pricing service returned no price" },
                })
            }
            return ok(fetched.amount)
        } catch (err) {
            return fail({
                type: "validation",
                message: (err as Error).message,
            })
        }
    }

    private makeEvent (type: string, payload: Record<string, unknown>): DomainEvent {
        return {
            type,
            payload,
            occurredAt: this.ctx.clock.now(),
        }
    }

    private validate (input: AddItemToOrderInput): Result<AddItemToOrderInput, ValidationError> {
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

        if (Object.keys(errors).length > 0) {
            return fail({
                type: "validation",
                message: "Invalid input",
                details: errors,
            })
        }

        return ok(input)
    }
}


