import { buildContainer } from "@composition/container"
import { buildServer } from "@infrastructure/http/server"

/* const port  = Number(process.env.PORT) ?? 3000
buildServer().then(app => app.listen({ port })) */

async function main () {
    const c = buildContainer()
    const app = await buildServer(c)

    const port = Number(c.cfg.PORT)
    const address = await app.listen({ port })
    c.ports?.events && c.cfg.USE_INMEMORY === "false" && console.log("Outbox ready")

    const shutdown = async (signal: string) => {
        c.logger.info(`Shutting down on ${signal}`)
        await app.close()
        if (c.pool) await c.pool.end()
            process.exit(0)
    }
    process.on("SIGTERM", () => shutdown("SIGTERM"))
    process.on("SIGINT", () => shutdown("SIGINT"))
}

main().catch(err => {console.error(err); process.exit(1) })