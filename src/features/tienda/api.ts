import { API_URL } from "../../shared/api"
import type { PublicProduct } from "../../lib/public-data"

export type TiendaFiltros = {
  categorias: { id: number; nombre: string; slug: string }[]
  marcas: { id: number; nombre: string }[]
  tipos_producto: { id: number; nombre: string }[]
}

export type TiendaProductoApi = {
  id_producto: number
  slug: string
  codigo_producto: string
  nombre: string
  marca: string
  categoria: string
  precio_venta: string
  unidad_medida: string
  agotado: boolean
  imagen_url: string
  imagen_alt: string
  descripcion?: string
  tipo_producto?: string
  nota_impuestos?: string
  seo?: {
    titulo: string
    descripcion: string
    canonical: string
    og_title: string
    og_description: string
  }
}

export type TiendaSede = { id_sede: number; nombre: string; direccion: string; whatsapp: string }

export function mapProducto(p: TiendaProductoApi): PublicProduct {
  const precio = Number.parseFloat(p.precio_venta) || 0
  return {
    id: p.id_producto,
    slug: p.slug,
    name: p.nombre,
    sku: p.codigo_producto,
    description: p.descripcion ?? "",
    brand: p.marca || null,
    category: p.categoria || null,
    categorySlug: null,
    artistic: false,
    colors: [],
    sizes: [],
    productType: p.tipo_producto ?? null,
    unit: p.unidad_medida || null,
    salePrice: precio,
    featured: false,
    inStock: !p.agotado,
    image: p.imagen_url ? { url: absolutizaImagen(p.imagen_url), alt: p.imagen_alt || p.nombre } : null,
  }
}

function absolutizaImagen(url: string): string {
  if (url.startsWith("http")) return url
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`
}

export async function fetchTiendaFiltros(): Promise<TiendaFiltros | null> {
  try {
    const r = await fetch(`${API_URL}/api/v1/tienda/filtros/`)
    if (!r.ok) return null
    return (await r.json()) as TiendaFiltros
  } catch {
    return null
  }
}

export type CatalogoQuery = {
  q?: string
  id_categoria?: number
  id_marca?: number
  id_tipo?: number
  precio_min?: string
  precio_max?: string
  orden?: string
  page?: number
  id_sede?: number
}

export async function fetchCatalogo(q: CatalogoQuery) {
  const p = new URLSearchParams()
  if (q.q) p.set("q", q.q)
  if (q.id_categoria) p.set("id_categoria", String(q.id_categoria))
  if (q.id_marca) p.set("id_marca", String(q.id_marca))
  if (q.id_tipo) p.set("id_tipo", String(q.id_tipo))
  if (q.precio_min) p.set("precio_min", q.precio_min)
  if (q.precio_max) p.set("precio_max", q.precio_max)
  if (q.orden) p.set("orden", q.orden)
  p.set("page", String(q.page ?? 1))
  if (q.id_sede) p.set("id_sede", String(q.id_sede))
  const r = await fetch(`${API_URL}/api/v1/tienda/catalogo/?${p}`)
  if (!r.ok) {
    const err = (await r.json().catch(() => ({}))) as { mensaje?: string }
    throw new Error(err.mensaje ?? "No fue posible cargar el catálogo. Intente nuevamente.")
  }
  return r.json() as Promise<{
    mensaje: string
    items: TiendaProductoApi[]
    total: number
    page: number
    page_size: number
  }>
}

export async function fetchProductoDetalle(slug: string, idSede?: number) {
  const q = idSede ? `?id_sede=${idSede}` : ""
  const r = await fetch(`${API_URL}/api/v1/tienda/productos/${encodeURIComponent(slug)}/${q}`)
  if (!r.ok) {
    const err = (await r.json().catch(() => ({}))) as { mensaje?: string }
    throw new Error(err.mensaje ?? "No fue posible cargar el producto. Intente nuevamente.")
  }
  const body = (await r.json()) as { item: TiendaProductoApi }
  return body.item
}

export type CarritoLineaIn = { id_producto: number; cantidad: number; precio_cliente?: number }

export async function validarCarrito(idSede: number | undefined, items: CarritoLineaIn[]) {
  const r = await fetch(`${API_URL}/api/v1/tienda/carrito/validar/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_sede: idSede ?? null, items }),
  })
  if (!r.ok) {
    const err = (await r.json().catch(() => ({}))) as { mensaje?: string }
    throw new Error(err.mensaje ?? "No fue posible validar su carrito. Intente nuevamente.")
  }
  return r.json() as Promise<{
    mensaje: string
    hubo_cambios: boolean
    items: {
      id_producto: number
      nombre: string
      slug: string
      codigo_producto: string
      cantidad: number
      precio_unitario: string
      subtotal: string
      imagen_url?: string
    }[]
    total: string
  }>
}

export async function fetchTiendaSedes(): Promise<TiendaSede[]> {
  const r = await fetch(`${API_URL}/api/v1/tienda/sedes/`)
  if (!r.ok) return []
  const body = (await r.json()) as { items?: TiendaSede[] }
  return body.items ?? []
}

export async function contactoWhatsapp(idSede: number | undefined, texto?: string) {
  const r = await fetch(`${API_URL}/api/v1/tienda/whatsapp/contacto/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_sede: idSede ?? null, texto }),
  })
  if (!r.ok) {
    const err = (await r.json().catch(() => ({}))) as { mensaje?: string }
    throw new Error(err.mensaje ?? "No fue posible abrir WhatsApp. Intente nuevamente.")
  }
  return r.json() as Promise<{ url_whatsapp: string }>
}

export type PedidoPayload = {
  cliente_nombre: string
  cliente_telefono: string
  direccion_entrega?: string
  observaciones?: string
  id_sede: number
  items: CarritoLineaIn[]
  clave_idempotencia?: string
}

export async function prepararPedido(datos: PedidoPayload) {
  const r = await fetch(`${API_URL}/api/v1/tienda/pedidos/preparar/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  })
  if (!r.ok) {
    const err = (await r.json().catch(() => ({}))) as { mensaje?: string }
    throw new Error(err.mensaje ?? "No fue posible preparar su pedido. Intente nuevamente.")
  }
  return r.json() as Promise<{ mensaje: string; url_whatsapp: string; id_pedido_web: number }>
}

export const ORDEN_URL: Record<string, string> = {
  "": "destacados",
  menor: "precio_asc",
  mayor: "precio_desc",
  nombre: "nombre_asc",
  "nombre-desc": "nombre_desc",
}

export const ORDEN_FROM_API: Record<string, string> = Object.fromEntries(
  Object.entries(ORDEN_URL).map(([k, v]) => [v, k === "" ? "nombre" : k]),
)