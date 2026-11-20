import { describe, expect, it } from "vitest"
import { parseBulkInventoryText } from "./inventory-bulk"

describe("parseBulkInventoryText", () => {
  it("parsea SKU - cantidad - costo", () => {
    const { lines, errors } = parseBulkInventoryText("LAC1 - 5 - 1000")
    expect(errors).toHaveLength(0)
    expect(lines[0]).toEqual({ sku: "LAC1", quantity: 5, unitCost: 1000 })
  })
})
