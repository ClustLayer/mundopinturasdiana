import { bogotaDay } from "./schedule"

export type PublicProduct = {
  id: number | string
  slug: string
  name: string
  sku: string
  description?: string | null
  brand?: string | null
  category?: string | null
  categorySlug?: string | null
  artistic: boolean
  colors: { name: string; hex: string }[]
  sizes: string[]
  productType?: string | null
  unit?: string | null
  salePrice: number
  featured: boolean
  inStock: boolean
  image: { url: string; alt: string } | null
}

export type SiteSettingsData = {
  whatsapp: string
  address: string
  instagram?: string | null
  facebook?: string | null
  tiktok?: string | null
}

export type PublicPromotion = {
  id: string
  title: string
  kind: "promocion" | "sorteo"
  description: string
  hashtags: string
  image: string
  startDate: string
  endDate: string
}

export type PublicEvent = {
  id: string
  title: string
  type: string
  description: string
  image: string
  startDate: string
  endDate: string
}

export type SiteImages = Record<"hero" | "mural" | "team", { url: string; alt: string } | null>

export type BranchRow = {
  id: string | number
  name: string
  address: string
  city?: string | null
  schedule?: string | null
  whatsapp?: string | null
  mapsUrl?: string | null
  mapQuery?: string | null
  active?: boolean
  order?: number
}

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

/** Sin datos sintéticos hasta integración con API / backend. */
export function getSiteSettings(): SiteSettingsData {
  return {
    whatsapp: "573122486627",
    address: "Calle 10 #10-15, Cali",
    instagram: "https://instagram.com/mundopinturasdiana",
    facebook: null,
    tiktok: null,
  }
}

export function getBranches(): BranchRow[] {
  return []
}

export function getProducts(): PublicProduct[] {
  return []
}

export function getProductBySlug(slug: string): PublicProduct | null {
  void slug
  return null
}

export function getBestSellerIds(): string[] {
  return []
}

export function getPromotions(): PublicPromotion[] {
  return []
}

export function getPublicEvents(): PublicEvent[] {
  return []
}

const IMG = {
  hero: "https://images.unsplash.com/photo-1588854337115-1c67d9247e4d?w=1200&q=80",
  mural: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200&q=80",
  team: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200&q=80",
}

export function getSiteImages(): SiteImages {
  return {
    hero: { url: IMG.hero, alt: "Tienda de pinturas Mundo Pinturas Diana" },
    mural: { url: IMG.mural, alt: "Mural artístico con color" },
    team: { url: IMG.team, alt: "Equipo en mostrador" },
  }
}

export function serverToday(): string {
  return bogotaDay()
}

export function getPanelNotifications() {
  return []
}

export function getTodaySalesSummary() {
  return { count: 0, total: 0 }
}

export function getLowStockCount() {
  return 0
}

export { slugify }
