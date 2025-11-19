import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';
import { MakeOrdersController } from '@infrastructure/http/controllers/OrdersController';

describe('OrdersController', () => {
  const mockReply = () =>
    ({
      code: vi.fn().mockReturnThis(),
      send: vi.fn(),
    }) as any as FastifyReply;

  let createOrder: { execute: ReturnType<typeof vi.fn> };
  let addItemToOrder: { execute: ReturnType<typeof vi.fn> };
  let deleteOrder: { execute: ReturnType<typeof vi.fn> };
  let controller: ReturnType<typeof MakeOrdersController>;

  beforeEach(() => {
    createOrder = {
      execute: vi.fn(async ({ orderId }: any) => ({
        orderId: orderId ?? 'generated-id',
      })),
    };
    addItemToOrder = {
      execute: vi.fn().mockResolvedValue({ ok: true, value: { total: { amount: 0, currency: 'EUR' } } }),
    };
    deleteOrder = {
      execute: vi.fn().mockResolvedValue(undefined),
    };
    controller = MakeOrdersController({
      createOrder: createOrder as any,
      addItemToOrder: addItemToOrder as any,
      deleteOrder: deleteOrder as any,
    });
  });

  describe('create', () => {
    it('should create order and return 201 with orderId', async () => {
      const reply = mockReply();
      const request = {
        body: {
          customerId: 'cust-1',
          items: [{ productId: 'prod-1', name: 'Widget', quantity: 1, unitPrice: 10 }],
        },
      } as any as FastifyRequest;

      await controller.create(request, reply);

      expect(createOrder.execute).toHaveBeenCalledWith(request.body);
      expect(reply.code).toHaveBeenCalledWith(201);
      const sentData = (reply.send as any).mock.calls[0][0];
      expect(sentData).toHaveProperty('orderId', 'generated-id');
    });

    it('should include explicit orderId when provided', async () => {
      const reply = mockReply();
      const request = {
        body: {
          orderId: 'custom-id-123',
          customerId: 'cust-1',
          items: [{ productId: 'prod-1', name: 'Widget', quantity: 1, unitPrice: 10 }],
        },
      } as any as FastifyRequest;

      await controller.create(request, reply);

      const sentData = (reply.send as any).mock.calls[0][0];
      expect(sentData.orderId).toBe('custom-id-123');
    });
  });

  describe('delete', () => {
    it('should delete order and return 204', async () => {
      const reply = mockReply();
      const request = { params: { id: 'order-to-delete' } } as any as FastifyRequest;

      await controller.delete(request, reply);

      expect(deleteOrder.execute).toHaveBeenCalledWith({ orderId: 'order-to-delete' });
      expect(reply.code).toHaveBeenCalledWith(204);
    });

    it('should return 404 when deleting non-existent order', async () => {
      deleteOrder.execute = vi.fn().mockRejectedValue(new Error('Order not found'));
      controller = MakeOrdersController({
        createOrder: createOrder as any,
        addItemToOrder: addItemToOrder as any,
        deleteOrder: deleteOrder as any,
      });

      const reply = mockReply();
      const request = { params: { id: 'missing' } } as any as FastifyRequest;

      await controller.delete(request, reply);

      expect(reply.code).toHaveBeenCalledWith(404);
      const sentData = (reply.send as any).mock.calls[0][0];
      expect(sentData).toHaveProperty('error', 'Order not found');
    });

    it('should return 500 on unexpected error', async () => {
      deleteOrder.execute = vi.fn().mockRejectedValue(new Error('boom'));
      controller = MakeOrdersController({
        createOrder: createOrder as any,
        addItemToOrder: addItemToOrder as any,
        deleteOrder: deleteOrder as any,
      });

      const reply = mockReply();
      const request = { params: { id: 'whatever' } } as any as FastifyRequest;

      await controller.delete(request, reply);

      expect(reply.code).toHaveBeenCalledWith(500);
      const sentData = (reply.send as any).mock.calls[0][0];
      expect(sentData).toHaveProperty('error', 'boom');
    });
  });
});
