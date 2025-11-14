export class Price {
    private constructor(readonly amount: number, readonly currency: "EUR" | "USD") {}

    static create(amount: number, currency: "EUR" | "USD") {
        if(!Number.isFinite(amount) || amount < 0) throw new Error("Invalid amount")
        const rounded = Math.round(amount * 100) / 100
        return new Price(rounded, currency)
    }
}