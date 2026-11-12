import fs from "node:fs"
import path from "node:path"

const src = path.resolve("c:/Users/adolf/Downloads/Clase/Gestión de Proyectos/MundoPinturasDiana-Demo/src/app/(frontend)/(site)/sobre-nosotros/page.tsx")
const out = path.resolve("c:/Users/adolf/Downloads/Clase/Gestión de Proyectos/mpdw-frontend/src/pages/about-page.tsx")

let c = fs.readFileSync(src, "utf8")
c = c.replace(/^import type \{ Metadata \}.*\n/m, "")
c = c.replace(/^export const metadata[\s\S]*?\n\n/m, "")
c = c.replace(/import Image from 'next\/image'\n/g, "")
c = c.replace(/import Link from 'next\/link'\n/g, "")
c = c.replace(/from '@\/lib\/data'/g, 'from "../lib/public-data"')
c = c.replace(/from '@\/components\//g, 'from "../components/')
c = c.replace(/export default async function About\(\)/, "export function AboutPage()")
c = c.replace(/const \[s, imgs\] = await Promise\.all\(\[getSiteSettings\(\), getSiteImages\(\)\]\)/, "const s = getSiteSettings()\n  const imgs = getSiteImages()")
c = c.replace(/<Link href=/g, "<Link to=")
c = c.replace(/<Image src=\{imgs\.team\.url\} alt=\{imgs\.team\.alt\} fill sizes="[^"]*" className="object-cover" \/>/, '<img src={imgs.team.url} alt={imgs.team.alt} className="absolute inset-0 size-full object-cover" />')
c = `import { Link } from "react-router-dom"\n` + c
fs.writeFileSync(out, c)
console.log("about-page.tsx")
