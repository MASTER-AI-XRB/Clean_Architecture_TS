import { EventBus } from "@application/ports/EventBus"
import { DomainEvent } from "@domain/events"
import  { randomUUID } from "crypto"

type Queryable = {query: (q: string, params?: any[]) => Promise<unknown> }

export class OutboxEventBus implements EventBus {
    constructor(private readonly db: Queryable) {}
    async publish(events: DomainEvent[]): Promise<void> {
        for (const e of events) {
            await this.db.query(
                `INSERT INTO outbox (id, type, payload, occurred_at, published_at) 
                VALUES ($1, $2, $3, $4, NULL)`, 
                [randomUUID(), e.type, JSON.stringify(e.payload), 
                    e.occurredAt.toISOString()]
                )
            }
        }
    }