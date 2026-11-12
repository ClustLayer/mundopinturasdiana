import fs from "node:fs"
import path from "node:path"

const src = path.resolve("c:/Users/adolf/Downloads/Clase/Gestión de Proyectos/MundoPinturasDiana-Demo/src/app/(frontend)/(site)/page.tsx")
const out = path.resolve("c:/Users/adolf/Downloads/Clase/Gestión de Proyectos/mpdw-frontend/src/pages/home-page.tsx")

let c = fs.readFileSync(src, "utf8")
c = c.replace(/^import type \{ Metadata \}.*\n/m, "")
c = c.replace(/^export const metadata.*\n/m, "")
c = c.replace(/^export const revalidate.*\n/m, "")
c = c.replace(/import Image from 'next\/image'\n/g, "")
c = c.replace(/import Link from 'next\/link'\n/g, "")
c = c.replace(/from '@\/lib\/data'/g, 'from "../lib/public-data"')
c = c.replace(/from '@\/components\//g, 'from "../components/')
c = c.replace(/from '@\/lib\/format'/g, 'from "../lib/format"')
c = c.replace(/export default async function Home\(\)/, "export function HomePage()")
c = c.replace(/const \[products, settings, branches, imgs, bestIds, promotions, events\] = await Promise\.all\(\[[^\]]+\]\)/,
  `const products = getProducts()
  const settings = getSiteSettings()
  const branches = getBranches()
  const imgs = getSiteImages()
  const bestIds = getBestSellerIds()
  const promotions = getPromotions()
  const events = getPublicEvents()`)
c = c.replace(/<Link href=/g, "<Link to=")
c = c.replace(/<Image src=\{imgs\.hero\.url\} alt=\{imgs\.hero\.alt\} fill priority sizes="[^"]*" className="object-cover" \/>/,
  '<img src={imgs.hero.url} alt={imgs.hero.alt} className="absolute inset-0 size-full object-cover" />')
c = c.replace(/<Image src=\{imgs\.mural\.url\} alt=\{imgs\.mural\.alt\} fill sizes="[^"]*" className="object-cover" \/>/,
  '<img src={imgs.mural.url} alt={imgs.mural.alt} className="absolute inset-0 size-full object-cover" />')
c = c.replace(/<Image src="\/brand\/logo\.png" alt="Logo Mundo Pinturas Diana" width=\{96\} height=\{96\} className="size-24 rounded-full object-cover" \/>/,
  '<img src="/brand/logo.png" alt="Logo Mundo Pinturas Diana" width={96} height={96} className="size-24 rounded-full object-cover" />')
c = `import { Link } from "react-router-dom"\n` + c
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, c)
console.log("wrote home-page.tsx")
