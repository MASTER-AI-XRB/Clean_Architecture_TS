import pino, { Logger as PinoInstance } from "pino"
import { Logger } from "@application/ports/Logger"

export class PinoLogger implements Logger {
    private readonly logger: PinoInstance

    constructor(logger?: PinoInstance) {
        this.logger = logger ?? pino()
    }

    info(message: string, meta?: Record<string, unknown>): void {
        this.logger.info(meta ?? {}, message)
    }

    error(message: string, meta?: Record<string, unknown>): void {
        this.logger.error(meta ?? {}, message)
    }

    warn(message: string, meta?: Record<string, unknown>): void {
        this.logger.warn(meta ?? {}, message)
    }

    debug(message: string, meta?: Record<string, unknown>): void {
        this.logger.debug(meta ?? {}, message)
    }

    fatal(message: string, meta?: Record<string, unknown>): void {
        this.logger.fatal(meta ?? {}, message)
    }

    trace(message: string, meta?: Record<string, unknown>): void {
        this.logger.trace(meta ?? {}, message)
    }

    log(message: string, meta?: Record<string, unknown>): void {
        this.logger.info(meta ?? {}, message) // o el mètode que decideixis
    }

    child(meta?: Record<string, unknown>): Logger {
        return new PinoLogger(this.logger.child(meta ?? {}))
    }
}