import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteOrder, DeleteOrderInput } from '@application/use-cases/DeleteOrderUseCase';
import { InMemoryOrderRepository } from '@infrastructure/persistence/InMemoryOrderRepository';
import { Order } from '@domain/entities/Order';

describe('DeleteOrder Use Case', () => {
  let useCase: DeleteOrder;
  let repo: InMemoryOrderRepository;

  beforeEach(() => {
    repo = new InMemoryOrderRepository();
    useCase = new DeleteOrder(repo);
  });

  it('should delete an existing order', async () => {
    // Setup: create an order
    const order = Order.create({
      id: 'order-1',
      customerId: 'cust-1',
      items: [
        {
          productId: 'prod-1',
          name: 'Widget',
          quantity: 1,
          unitPrice: 10,
        },
      ],
    });
    await repo.save(order);

    // Act: delete it
    const input: DeleteOrderInput = { orderId: 'order-1' };
    await useCase.execute(input);

    // Assert: should be gone
    const deletedOrder = await repo.findById('order-1');
    expect(deletedOrder).toBeNull();
  });

  it('should throw error when deleting non-existent order', async () => {
    const input: DeleteOrderInput = { orderId: 'non-existent' };

    await expect(useCase.execute(input)).rejects.toThrow('Order not found');
  });

  it('should delete multiple orders independently', async () => {
    // Setup: create two orders
    const order1 = Order.create({
      id: 'order-1',
      customerId: 'cust-1',
      items: [
        {
          productId: 'prod-1',
          name: 'Widget',
          quantity: 1,
          unitPrice: 10,
        },
      ],
    });

    const order2 = Order.create({
      id: 'order-2',
      customerId: 'cust-2',
      items: [
        {
          productId: 'prod-2',
          name: 'Gadget',
          quantity: 1,
          unitPrice: 20,
        },
      ],
    });

    await repo.save(order1);
    await repo.save(order2);

    // Act: delete only order-1
    await useCase.execute({ orderId: 'order-1' });

    // Assert: order-1 gone, order-2 still exists
    expect(await repo.findById('order-1')).toBeNull();
    expect(await repo.findById('order-2')).toBeTruthy();
  });

  it('should handle empty orderId gracefully', async () => {
    const input: DeleteOrderInput = { orderId: '' };

    await expect(useCase.execute(input)).rejects.toThrow('Order not found');
  });

  it('should delete order even if it has complex state', async () => {
    // Setup: create order with multiple items and state changes
    const order = Order.create({
      id: 'order-complex',
      customerId: 'cust-1',
      items: [
        {
          productId: 'prod-1',
          name: 'Widget',
          quantity: 2,
          unitPrice: 10,
        },
      ],
    });

    order.confirm();
    order.markPaid();

    await repo.save(order);

    // Act: delete it
    await useCase.execute({ orderId: 'order-complex' });

    // Assert: should be deleted despite its state
    const deleted = await repo.findById('order-complex');
    expect(deleted).toBeNull();
  });
});
