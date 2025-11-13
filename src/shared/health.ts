export function checkHealth (): { status : string; timestamp: Date; } {
  return {
    status : 'OK',
    timestamp: new Date()
  };
}
