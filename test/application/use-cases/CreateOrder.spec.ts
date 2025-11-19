import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateOrder, CreateOrderInput } from '@application/use-cases/CreateOrderUseCase';
import { InMemoryOrderRepository } from '@infrastructure/persistence/InMemoryOrderRepository';

describe('CreateOrder Use Case', () => {
  let useCase: CreateOrder;
  let repo: InMemoryOrderRepository;
  let events: { publish: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repo = new InMemoryOrderRepository();
    events = {
      publish: vi.fn().mockResolvedValue(undefined),
    };
    useCase = new CreateOrder(repo, events as any);
  });

  it('should create a new order successfully', async () => {
    const input: CreateOrderInput = {
      customerId: 'cust-1',
      items: [
        {
          productId: 'prod-1',
          name: 'Widget',
          quantity: 2,
          unitPrice: 19.99,
        },
      ],
    };

    const output = await useCase.execute(input);

    expect(output.orderId).toBeTruthy();
    expect(output.orderId.length).toBeGreaterThan(0);
  });

  it('should persist order in repository', async () => {
    const input: CreateOrderInput = {
      customerId: 'cust-1',
      items: [
        {
          productId: 'prod-1',
          name: 'Widget',
          quantity: 1,
          unitPrice: 10,
        },
      ],
    };

    const output = await useCase.execute(input);
    const savedOrder = await repo.findById(output.orderId);

    expect(savedOrder).toBeTruthy();
    expect(savedOrder?.customerId).toBe('cust-1');
    expect(savedOrder?.items.length).toBe(1);
  });

  it('should create order with provided orderId', async () => {
    const input: CreateOrderInput = {
      orderId: 'custom-order-id',
      customerId: 'cust-1',
      items: [
        {
          productId: 'prod-1',
          name: 'Widget',
          quantity: 1,
          unitPrice: 10,
        },
      ],
    };

    const output = await useCase.execute(input);

    expect(output.orderId).toBe('custom-order-id');
  });

  it('should throw error if order with same id already exists', async () => {
    const input: CreateOrderInput = {
      orderId: 'order-1',
      customerId: 'cust-1',
      items: [
        {
          productId: 'prod-1',
          name: 'Widget',
          quantity: 1,
          unitPrice: 10,
        },
      ],
    };

    await useCase.execute(input);

    await expect(useCase.execute(input)).rejects.toThrow('Order already exists');
  });

  it('should throw error if items array is empty', async () => {
    const input: CreateOrderInput = {
      customerId: 'cust-1',
      items: [],
    };

    await expect(useCase.execute(input)).rejects.toThrow('Order must have at least one item');
  });

  it('should throw error if customerId is empty', async () => {
    const input: CreateOrderInput = {
      customerId: '',
      items: [
        {
          productId: 'prod-1',
          name: 'Widget',
          quantity: 1,
          unitPrice: 10,
        },
      ],
    };

    await expect(useCase.execute(input)).rejects.toThrow('Order requires customerId');
  });

  it('should create multiple orders with different ids', async () => {
    const input1: CreateOrderInput = {
      customerId: 'cust-1',
      items: [
        {
          productId: 'prod-1',
          name: 'Widget',
          quantity: 1,
          unitPrice: 10,
        },
      ],
    };

    const input2: CreateOrderInput = {
      customerId: 'cust-2',
      items: [
        {
          productId: 'prod-2',
          name: 'Gadget',
          quantity: 2,
          unitPrice: 5,
        },
      ],
    };

    const output1 = await useCase.execute(input1);
    const output2 = await useCase.execute(input2);

    expect(output1.orderId).not.toBe(output2.orderId);

    const order1 = await repo.findById(output1.orderId);
    const order2 = await repo.findById(output2.orderId);

    expect(order1?.customerId).toBe('cust-1');
    expect(order2?.customerId).toBe('cust-2');
  });
});
