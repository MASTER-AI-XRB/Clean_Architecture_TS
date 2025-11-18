export type ValidationError = { type: 'ValidationError'; message: string; details?: Record<string, string> }
export type NotFoundError = { type: 'not_found'; resource: string; id: string }
export type ConflictError = { type: 'conflict'; message: string }
export type InfraError = { type: 'infrastructure'; message: string }
export type AppError = ValidationError | NotFoundError | ConflictError | InfraError