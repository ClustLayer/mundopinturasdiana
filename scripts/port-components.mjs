import fs from "node:fs"
import path from "node:path"

const demo = path.resolve("c:/Users/adolf/Downloads/Clase/Gestión de Proyectos/MundoPinturasDiana-Demo/src")
const dest = path.resolve("c:/Users/adolf/Downloads/Clase/Gestión de Proyectos/mpdw-frontend/src")

const files = [
  "components/ui/splash.tsx",
  "components/ui/reveal.tsx",
  "components/site/map-embed.ts",
  "components/site/phone.ts",
  "components/site/today-status.tsx",
  "components/site/branch-card.tsx",
  "components/site/product-carousel.tsx",
  "components/site/promotions-section.tsx",
  "components/site/events-section.tsx",
  "components/cart/cart-provider.tsx",
  "components/cart/cart-client.tsx",
  "components/catalog-client.tsx",
  "components/product-card.tsx",
  "components/site-header.tsx",
  "components/site-footer.tsx",
]

function mapImport(spec) {
  if (spec.startsWith("@/lib/data")) return spec.replace("@/lib/data", "../lib/public-data")
  if (spec.startsWith("@/lib/format")) return spec.replace("@/lib/format", "../lib/format")
  if (spec.startsWith("@/lib/schedule")) return spec.replace("@/lib/schedule", "../lib/schedule")
  if (spec.startsWith("@/components/")) {
    const rel = spec.slice("@/components/".length)
    return `../components/${rel}`
  }
  return spec
}

function transform(content, file) {
  content = content.replace(/^['"]use client['"]\r?\n/gm, "")
  content = content.replace(/^import type \{ Metadata \}.*\r?\n/gm, "")
  content = content.replace(/^export const metadata.*\r?\n/gm, "")
  content = content.replace(/^export const revalidate.*\r?\n/gm, "")

  content = content.replace(/from ['"]next\/link['"]/g, 'from "react-router-dom"')
  content = content.replace(/from ['"]next\/navigation['"]/g, 'from "react-router-dom"')
  content = content.replace(/import Image from ['"]next\/image['"]\r?\n/g, "")

  content = content.replace(/import \{([^}]+)\} from ['"]@\/[^'"]+['"]/g, (m, inner) => {
    const spec = m.match(/from ['"]([^'"]+)['"]/)[1]
    const mapped = mapImport(spec)
    return `import {${inner}} from "${mapped}"`
  })
  content = content.replace(/import type \{([^}]+)\} from ['"]@\/[^'"]+['"]/g, (m, inner) => {
    const spec = m.match(/from ['"]([^'"]+)['"]/)[1]
    const mapped = mapImport(spec)
    return `import type {${inner}} from "${mapped}"`
  })
  content = content.replace(/from ['"]@\/[^'"]+['"]/g, (m) => {
    const spec = m.match(/from ['"]([^'"]+)['"]/)[1]
    return `from "${mapImport(spec)}"`
  })

  content = content.replace(/\busePathname\b/g, "useLocation")
  content = content.replace(/const path = useLocation\(\)/g, "const { pathname: path } = useLocation()")
  content = content.replace(/useSearchParams\(\)/g, "useSearchParams()")

  content = content.replace(/<Link([^>]*)\shref=/g, "<Link$1 to=")
  content = content.replace(/\shref=\{([^}]+)\}/g, " to={$1}")
  content = content.replace(/\sscroll=\{false\}/g, "")

  // next/image fill pattern -> img with absolute positioning
  content = content.replace(
    /<Image src=\{([^}]+)\} alt=\{([^}]+)\} fill([^/]*)\/>/g,
    '<img src={$1} alt={$2} className="absolute inset-0 size-full object-cover"$3 />',
  )
  content = content.replace(
    /<Image src=\{([^}]+)\} alt=\{([^}]+)\} width=\{(\d+)\} height=\{(\d+)\}([^/]*)\/>/g,
    '<img src={$1} alt={$2} width={$3} height={$4}$5 />',
  )
  content = content.replace(
    /<Image src="([^"]+)" alt="([^"]*)" width=\{(\d+)\} height=\{(\d+)\}([^/]*)\/>/g,
    '<img src="$1" alt="$2" width={$3} height={$4}$5 />',
  )
  content = content.replace(
    /<Image src="([^"]+)" alt="" width=\{(\d+)\} height=\{(\d+)\}([^/]*)\/>/g,
    '<img src="$1" alt="" width={$2} height={$3}$4 />',
  )

  if (file.includes("catalog-client")) {
    content = content.replace(/const router = useRouter\(\)/, "")
    content = content.replace(/router\.replace\(`\$\{path\}\$\{([^`]+)\}`[^)]*\)/g, "window.history.replaceState(null, '', `${path}${$1}`)")
  }

  if (file.includes("promotions-section")) {
    content = content.replace(/fetch\('\/api\/track'[^)]+\)\.catch[^)]+\)/g, "undefined")
  }

  if (file.includes("cart-client")) {
    content = content.replace(/from ['"]\.\/ui\/toaster['"]/g, 'from "../features/en-desarrollo"')
  }

  if (file.includes("product-card")) {
    content = content.replace(/from ['"]\.\/ui\/toaster['"]/g, 'from "../features/en-desarrollo"')
    content = content.replace(/toast\(/g, "toastEnDesarrollo(")
  }

  return content
}

for (const rel of files) {
  const src = path.join(demo, rel)
  const out = path.join(dest, rel)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  let content = fs.readFileSync(src, "utf8")
  content = transform(content, rel)
  fs.writeFileSync(out, content)
  console.log("ported", rel)
}
