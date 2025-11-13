import {checkHealth} from './src/shared/health.js';

const health = checkHealth();
console.log(`Status: ${health.status}, Timestamp: ${health.timestamp.toISOString()}`);