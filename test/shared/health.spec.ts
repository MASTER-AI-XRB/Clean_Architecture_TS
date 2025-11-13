import { describe, it, expect } from 'vitest';
import { checkHealth } from '../../src/shared/health';

describe('checkHealth', () => {
  it('should return health status OK and a timestamp', () => {
    const health = checkHealth();

    expect(health.status).toBe('OK');
    expect(health.timestamp).toBeInstanceOf(Date);
  });

  it('should return current timestamp', () => {
    const before = new Date();
    const result = checkHealth();
    const after = new Date();

    expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});