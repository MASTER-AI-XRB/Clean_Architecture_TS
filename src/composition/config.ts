import { z } from "zod"

export const Config =  z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().url().optional(),
    PRICING_SERVICE_URL: z.string().url().default("http://localhost:4000"),
    USE_INMEMORY: z.enum(["true", "false"]).default("true"),
    PORT: z.string().default("3000")
})

export type Config = z.infer<typeof Config>

export function loadConfig(env = process.env): Config {
    const parsed = Config.safeParse(env)
    if (!parsed.success) throw new Error(parsed.error.message)
        return parsed.data
}