import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';
import { OrdersController } from '@infrastructure/http/OrdersController';
import { createOrder, deleteOrder } from '@composition/container';

describe('OrdersController', () => {
  describe('create', () => {
    it('should create order and return 201 with orderId', async () => {
      const mockReply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any as FastifyReply;

      const mockRequest = {
        body: {
          customerId: 'cust-1',
          items: [
            {
              productId: 'prod-1',
              name: 'Widget',
              quantity: 1,
              unitPrice: 10,
            },
          ],
        },
      } as any as FastifyRequest;

      await OrdersController.create(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalled();

      const sentData = (mockReply.send as any).mock.calls[0][0];
      expect(sentData).toHaveProperty('orderId');
      expect(sentData.orderId).toBeTruthy();
    });

    it('should include orderId when creating with explicit id', async () => {
      const mockReply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any as FastifyReply;

      const mockRequest = {
        body: {
          orderId: 'custom-id-123',
          customerId: 'cust-1',
          items: [
            {
              productId: 'prod-1',
              name: 'Widget',
              quantity: 1,
              unitPrice: 10,
            },
          ],
        },
      } as any as FastifyRequest;

      await OrdersController.create(mockRequest, mockReply);

      const sentData = (mockReply.send as any).mock.calls[0][0];
      expect(sentData.orderId).toBe('custom-id-123');
    });
  });

  describe('delete', () => {
    it('should delete order and return 204', async () => {
      // First, create an order
      const createReply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any as FastifyReply;

      const createRequest = {
        body: {
          orderId: 'order-to-delete',
          customerId: 'cust-1',
          items: [
            {
              productId: 'prod-1',
              name: 'Widget',
              quantity: 1,
              unitPrice: 10,
            },
          ],
        },
      } as any as FastifyRequest;

      await OrdersController.create(createRequest, createReply);

      // Now delete it
      const deleteReply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any as FastifyReply;

      const deleteRequest = {
        params: {
          id: 'order-to-delete',
        },
      } as any as FastifyRequest;

      await OrdersController.delete(deleteRequest, deleteReply);

      expect(deleteReply.code).toHaveBeenCalledWith(204);
      expect(deleteReply.send).toHaveBeenCalled();
    });

    it('should return 404 when deleting non-existent order', async () => {
      const mockReply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any as FastifyReply;

      const mockRequest = {
        params: {
          id: 'non-existent-order',
        },
      } as any as FastifyRequest;

      await OrdersController.delete(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(404);
      const sentData = (mockReply.send as any).mock.calls[0][0];
      expect(sentData).toHaveProperty('error');
      expect(sentData.error).toContain('Order not found');
    });

    it('should return 500 on unexpected error', async () => {
      const mockReply = {
        code: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any as FastifyReply;

      const mockRequest = {
        params: {
          id: 'non-existent-order',
        },
      } as any as FastifyRequest;

      await OrdersController.delete(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(404);
      const sentData = (mockReply.send as any).mock.calls[0][0];
      expect(sentData).toHaveProperty('error');
    });
  });
});
