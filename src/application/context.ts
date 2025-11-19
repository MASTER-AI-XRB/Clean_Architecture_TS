import type { OrderRepository } from "./ports/OrderRepository"
import type { PricingService } from "./ports/PricingService"
import type { EventBus } from "./ports/EventBus"
import type { Clock } from "./ports/Clock"
export type AppContext = { 
    orders: OrderRepository; 
    pricing: PricingService; 
    events: EventBus; 
    clock: Clock 
}