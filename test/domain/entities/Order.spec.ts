import { describe, it, expect, beforeEach } from 'vitest';
import { Order, OrderItem, OrderItemProps, OrderProps } from '@domain/entities/Order';

describe('OrderItem', () => {
  it('should create an OrderItem with valid props', () => {
    const props: OrderItemProps = {
      productId: 'prod-1',
      name: 'Widget',
      quantity: 2,
      unitPrice: 19.99,
    };
    const item = new OrderItem(props);

    expect(item.productId).toBe('prod-1');
    expect(item.name).toBe('Widget');
    expect(item.quantity).toBe(2);
    expect(item.unitPrice).toBe(19.99);
  });

  it('should calculate total correctly', () => {
    const item = new OrderItem({
      productId: 'prod-1',
      name: 'Widget',
      quantity: 3,
      unitPrice: 10,
    });

    expect(item.total).toBe(30);
  });

  it('should throw error if productId is missing', () => {
    expect(() => {
      new OrderItem({
        productId: '',
        name: 'Widget',
        quantity: 1,
        unitPrice: 10,
      });
    }).toThrow('OrderItem requires productId');
  });

  it('should throw error if name is missing', () => {
    expect(() => {
      new OrderItem({
        productId: 'prod-1',
        name: '',
        quantity: 1,
        unitPrice: 10,
      });
    }).toThrow('OrderItem requires name');
  });

  it('should throw error if quantity is not a positive integer', () => {
    expect(() => {
      new OrderItem({
        productId: 'prod-1',
        name: 'Widget',
        quantity: 0,
        unitPrice: 10,
      });
    }).toThrow('quantity must be a positive integer');
  });

  it('should throw error if unitPrice is negative', () => {
    expect(() => {
      new OrderItem({
        productId: 'prod-1',
        name: 'Widget',
        quantity: 1,
        unitPrice: -5,
      });
    }).toThrow('unitPrice must be a non-negative number');
  });

  it('should convert to primitives', () => {
    const props: OrderItemProps = {
      productId: 'prod-1',
      name: 'Widget',
      quantity: 2,
      unitPrice: 19.99,
      metadata: { color: 'red' },
    };
    const item = new OrderItem(props);
    const primitives = item.toPrimitives();

    expect(primitives.productId).toBe('prod-1');
    expect(primitives.name).toBe('Widget');
    expect(primitives.quantity).toBe(2);
    expect(primitives.unitPrice).toBe(19.99);
    // metadata not returned in toPrimitives
  });

  it('should create from primitives', () => {
    const props: OrderItemProps = {
      productId: 'prod-1',
      name: 'Widget',
      quantity: 2,
      unitPrice: 19.99,
    };
    const item = OrderItem.fromPrimitives(props);

    expect(item.productId).toBe('prod-1');
    expect(item.quantity).toBe(2);
  });
});

describe('Order', () => {
  let basicProps: OrderProps;

  beforeEach(() => {
    basicProps = {
      id: 'order-1',
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
  });

  it('should create an Order using factory with provided id', () => {
    const order = Order.create({
      id: 'order-123',
      customerId: 'cust-1',
      items: [
        {
          productId: 'prod-1',
          name: 'Widget',
          quantity: 1,
          unitPrice: 20,
        },
      ],
    });

    expect(order.id).toBe('order-123');
    expect(order.customerId).toBe('cust-1');
    expect(order.items.length).toBe(1);
    expect(order.status).toBe('pending');
  });

  it('should generate id if not provided', () => {
    const order = Order.create({
      customerId: 'cust-1',
      items: [
        {
          productId: 'prod-1',
          name: 'Widget',
          quantity: 1,
          unitPrice: 20,
        },
      ],
    });

    expect(order.id).toBeTruthy();
    expect(order.id.length).toBeGreaterThan(0);
  });

  it('should throw error if no items provided', () => {
    expect(() => {
      Order.create({
        customerId: 'cust-1',
        items: [],
      });
    }).toThrow('Order must have at least one item');
  });

  it('should throw error if customerId is missing', () => {
    expect(() => {
      Order.create({
        customerId: '',
        items: [
          {
            productId: 'prod-1',
            name: 'Widget',
            quantity: 1,
            unitPrice: 20,
          },
        ],
      });
    }).toThrow('Order requires customerId');
  });

  it('should calculate total price correctly', () => {
    const order = Order.create({
      customerId: 'cust-1',
      items: [
        {
          productId: 'prod-1',
          name: 'Widget',
          quantity: 2,
          unitPrice: 10,
        },
        {
          productId: 'prod-2',
          name: 'Gadget',
          quantity: 3,
          unitPrice: 5,
        },
      ],
    });

    expect(order.total).toBe(2 * 10 + 3 * 5);
  });

  it('should add item to order', () => {
    const order = Order.create({
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

    order.addItem({
      productId: 'prod-2',
      name: 'Gadget',
      quantity: 2,
      unitPrice: 5,
    });

    expect(order.items.length).toBe(2);
    expect(order.total).toBe(10 + 10);
  });

  it('should merge items with same productId when adding', () => {
    const order = Order.create({
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

    order.addItem({
      productId: 'prod-1',
      name: 'Widget',
      quantity: 3,
      unitPrice: 10,
    });

    expect(order.items.length).toBe(1);
    expect(order.items[0].quantity).toBe(5);
  });

  it('should remove item from order', () => {
    const order = Order.create({
      customerId: 'cust-1',
      items: [
        {
          productId: 'prod-1',
          name: 'Widget',
          quantity: 1,
          unitPrice: 10,
        },
        {
          productId: 'prod-2',
          name: 'Gadget',
          quantity: 1,
          unitPrice: 5,
        },
      ],
    });

    order.removeItem('prod-1');

    expect(order.items.length).toBe(1);
    expect(order.items[0].productId).toBe('prod-2');
  });

  it('should throw error when removing non-existent item', () => {
    const order = Order.create({
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

    expect(() => order.removeItem('prod-999')).toThrow('Product not found in order');
  });

  it('should throw error when removing last item', () => {
    const order = Order.create({
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

    expect(() => order.removeItem('prod-1')).toThrow('Order must have at least one item');
  });

  it('should update item quantity', () => {
    const order = Order.create({
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

    order.updateItemQuantity('prod-1', 5);

    expect(order.items[0].quantity).toBe(5);
  });

  it('should throw error on invalid quantity update', () => {
    const order = Order.create({
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

    expect(() => order.updateItemQuantity('prod-1', 0)).toThrow('quantity must be a positive integer');
  });

  it('should confirm pending order', () => {
    const order = Order.create({
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

    order.confirm();
    expect(order.status).toBe('confirmed');
  });

  it('should throw error confirming non-pending order', () => {
    const order = Order.create({
      customerId: 'cust-1',
      items: [
        {
          productId: 'prod-1',
          name: 'Widget',
          quantity: 1,
          unitPrice: 10,
        },
      ],
      status: 'confirmed',
    });

    expect(() => order.confirm()).toThrow('Only pending orders can be confirmed');
  });

  it('should mark order as paid', () => {
    const order = Order.create({
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

    order.markPaid();
    expect(order.status).toBe('paid');
  });

  it('should mark order as shipped', () => {
    const order = Order.create({
      customerId: 'cust-1',
      items: [
        {
          productId: 'prod-1',
          name: 'Widget',
          quantity: 1,
          unitPrice: 10,
        },
      ],
      status: 'paid',
    });

    order.markShipped();
    expect(order.status).toBe('shipped');
  });

  it('should throw error shipping non-paid order', () => {
    const order = Order.create({
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

    expect(() => order.markShipped()).toThrow('Only paid orders can be shipped');
  });

  it('should cancel pending order', () => {
    const order = Order.create({
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

    order.cancel('Customer request');
    expect(order.status).toBe('cancelled');
  });

  it('should throw error cancelling shipped order', () => {
    const order = Order.create({
      customerId: 'cust-1',
      items: [
        {
          productId: 'prod-1',
          name: 'Widget',
          quantity: 1,
          unitPrice: 10,
        },
      ],
      status: 'shipped',
    });

    expect(() => order.cancel()).toThrow('Shipped orders cannot be cancelled');
  });

  it('should convert to primitives', () => {
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

    const primitives = order.toPrimitives();

    expect(primitives.id).toBe('order-1');
    expect(primitives.customerId).toBe('cust-1');
    expect(primitives.items.length).toBe(1);
    expect(primitives.status).toBe('pending');
  });

  it('should restore from primitives', () => {
    const primitives: OrderProps = {
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
      status: 'confirmed',
    };

    const order = Order.fromPrimitives(primitives);

    expect(order.id).toBe('order-1');
    expect(order.customerId).toBe('cust-1');
    expect(order.status).toBe('confirmed');
  });
});
