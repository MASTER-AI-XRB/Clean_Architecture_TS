// src/domain/entities/Order.ts

export type OrderStatus = 'pending' | 'confirmed' | 'paid' | 'shipped' | 'cancelled'

export interface OrderItemProps {
    productId: string
    name: string
    quantity: number
    unitPrice: number // minor units or float depending on project convention
    metadata?: Record<string, any>
}

export interface OrderProps {
    id: string
    customerId: string
    items: OrderItemProps[]
    status?: OrderStatus
    createdAt?: Date
    updatedAt?: Date
    metadata?: Record<string, any>
}

function generateId(): string {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
        return (crypto as any).randomUUID()
    }
    // fallback simple id
    return (
        Date.now().toString(36) +
        '-' +
        Math.random().toString(36).slice(2, 10)
    )
}

function ensurePositiveInteger(value: number, name = 'value') {
    if (!Number.isFinite(value) || value <= 0 || Math.floor(value) !== value) {
        throw new Error(`${name} must be a positive integer`)
    }
}

export class OrderItem {
    readonly productId: string
    readonly name: string
    readonly quantity: number
    readonly unitPrice: number
    readonly metadata?: Record<string, any>

    constructor(props: OrderItemProps) {
        if (!props.productId) throw new Error('OrderItem requires productId')
        if (!props.name) throw new Error('OrderItem requires name')
        ensurePositiveInteger(props.quantity, 'quantity')
        if (!Number.isFinite(props.unitPrice) || props.unitPrice < 0) {
            throw new Error('unitPrice must be a non-negative number')
        }

        this.productId = props.productId
        this.name = props.name
        this.quantity = props.quantity
        this.unitPrice = props.unitPrice
        this.metadata = props.metadata
    }

    get total(): number {
        return this.quantity * this.unitPrice
    }

    toPrimitives(): OrderItemProps {
        return {
            productId: this.productId,
            name: this.name,
            quantity: this.quantity,
            unitPrice: this.unitPrice,
            metadata: this.metadata,
        }
    }

    static fromPrimitives(p: OrderItemProps): OrderItem {
        return new OrderItem(p)
    }
}

export class Order {
    readonly id: string
    private _items: OrderItem[]
    readonly customerId: string
    private _status: OrderStatus
    readonly createdAt: Date
    private _updatedAt: Date
    readonly metadata?: Record<string, any>

    private constructor(props: OrderProps) {
        if (!props.id) throw new Error('Order requires id')
        if (!props.customerId) throw new Error('Order requires customerId')
        if (!Array.isArray(props.items)) throw new Error('Order requires items array')
        if (props.items.length === 0) throw new Error('Order must have at least one item')

        this.id = props.id
        this.customerId = props.customerId
        this._items = props.items.map(i => new OrderItem(i))
        this._status = props.status ?? 'pending'
        this.createdAt = props.createdAt ?? new Date()
        this._updatedAt = props.updatedAt ?? new Date()
        this.metadata = props.metadata
    }

    static create(props: Omit<OrderProps, 'id' | 'createdAt' | 'updatedAt' | 'status'> & Partial<Pick<OrderProps, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'metadata'>>): Order {
        const id = props.id ?? generateId()
        return new Order({
            id,
            customerId: props.customerId,
            items: props.items,
            status: props.status,
            createdAt: props.createdAt,
            updatedAt: props.updatedAt,
            metadata: props.metadata,
        })
    }

    static fromPrimitives(p: OrderProps): Order {
        // Accept plain objects (e.g., from DB) and create entity
        return new Order({
            id: p.id,
            customerId: p.customerId,
            items: p.items,
            status: p.status,
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
            updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
            metadata: p.metadata,
        })
    }

    toPrimitives(): OrderProps {
        return {
            id: this.id,
            customerId: this.customerId,
            items: this._items.map(i => i.toPrimitives()),
            status: this._status,
            createdAt: this.createdAt,
            updatedAt: this._updatedAt,
            metadata: this.metadata,
        }
    }

    get items(): ReadonlyArray<OrderItem> {
        return this._items.slice()
    }

    get status(): OrderStatus {
        return this._status
    }

    get updatedAt(): Date {
        return new Date(this._updatedAt)
    }

    get total(): number {
        return this._items.reduce((sum, it) => sum + it.total, 0)
    }

    addItem(item: OrderItemProps) {
        const newItem = new OrderItem(item)
        const existingIndex = this._items.findIndex(i => i.productId === newItem.productId)
        if (existingIndex >= 0) {
            const existing = this._items[existingIndex]
            const merged = new OrderItem({
                productId: existing.productId,
                name: existing.name,
                quantity: existing.quantity + newItem.quantity,
                unitPrice: newItem.unitPrice, // last price wins; adapt if business rules differ
                metadata: { ...(existing.metadata ?? {}), ...(newItem.metadata ?? {}) },
            })
            this._items[existingIndex] = merged
        } else {
            this._items.push(newItem)
        }
        this.touch()
    }

    removeItem(productId: string) {
        const before = this._items.length
        this._items = this._items.filter(i => i.productId !== productId)
        if (this._items.length === before) {
            throw new Error('Product not found in order')
        }
        if (this._items.length === 0) {
            throw new Error('Order must have at least one item')
        }
        this.touch()
    }

    updateItemQuantity(productId: string, quantity: number) {
        ensurePositiveInteger(quantity, 'quantity')
        const idx = this._items.findIndex(i => i.productId === productId)
        if (idx < 0) throw new Error('Product not found in order')
        const existing = this._items[idx]
        this._items[idx] = new OrderItem({
            productId: existing.productId,
            name: existing.name,
            quantity,
            unitPrice: existing.unitPrice,
            metadata: existing.metadata,
        })
        this.touch()
    }

    confirm() {
        if (this._status !== 'pending') throw new Error('Only pending orders can be confirmed')
        this._status = 'confirmed'
        this.touch()
    }

    markPaid() {
        if (this._status !== 'confirmed' && this._status !== 'pending') {
            throw new Error('Order must be pending or confirmed to be paid')
        }
        this._status = 'paid'
        this.touch()
    }

    markShipped() {
        if (this._status !== 'paid') throw new Error('Only paid orders can be shipped')
        this._status = 'shipped'
        this.touch()
    }

    cancel(reason?: string) {
        if (this._status === 'shipped') throw new Error('Shipped orders cannot be cancelled')
        this._status = 'cancelled'
        if (reason) {
            // attach reason to metadata (immutable merge)
            const meta = { ...(this.metadata ?? {}), cancellationReason: reason }
            ;(this as any).metadata = meta
        }
        this.touch()
    }

    private touch() {
        this._updatedAt = new Date()
    }
}