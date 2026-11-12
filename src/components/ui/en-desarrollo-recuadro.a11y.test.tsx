import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { axe } from "vitest-axe"
import { EnDesarrolloRecuadro } from "./en-desarrollo-recuadro"

describe("EnDesarrolloRecuadro accesibilidad", () => {
  it("no reporta violaciones axe en el recuadro base", async () => {
    const { container } = render(<EnDesarrolloRecuadro />)
    const results = await axe(container)
    expect(results.violations).toEqual([])
  })
})
