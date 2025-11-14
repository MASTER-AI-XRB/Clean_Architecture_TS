import { InMemoryOrderRepository } from "@infrastructure/persistence/InMemoryOrderRepository"
import { CreateOrder } from "@application/use-cases/CreateOrderUseCase"
import { DeleteOrder } from "@application/use-cases/DeleteOrderUseCase"

const repo = new InMemoryOrderRepository()

export const createOrder = new CreateOrder(repo)
export const deleteOrder = new DeleteOrder(repo)