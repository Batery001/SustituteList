# Substitute List — Hub SaaS Multitenant

Plataforma para tiendas Pokémon TCG: torneos, inscripciones, pagos (Transbank) y decklists Standard.

## Estructura `src/`

```
src/
├── app/                    # App Router
│   ├── (hub)/              # Descubrimiento público
│   │   ├── tiendas/        # Listado tiendas
│   │   └── t/[storeSlug]/  # Ficha tienda
│   ├── admin/              # Panel tienda (tenant)
│   ├── jugador/            # Cuenta global jugador
│   ├── e/[slug]/           # Torneo + inscripción + lista
│   ├── login/              # Login unificado
│   └── api/                # Route Handlers
├── components/
│   ├── layout/             # Shell, nav, logo
│   ├── hub/                # Home, cards tienda
│   ├── store/              # Panel admin
│   ├── player/             # Cuenta, mazos
│   ├── event/              # Inscripción, pago, decklist
│   ├── judge/              # (fase posterior)
│   └── ui/                 # Primitivos
├── lib/
│   ├── auth/               # Sesiones tienda + jugador
│   ├── payments/           # Transbank Webpay
│   └── …                   # db, parser, utils
├── models/                 # Mongoose (multitenant por storeId)
└── types/                  # Tipos TS compartidos
```

## Multitenant

`Store` → `Event` → `Registration` → `DecklistSubmission`

Cada tienda tiene `slug` público en `/t/{slug}`.

## Tema

CSS en `app/globals.css` — cyber Substitute (no cambiar sin acuerdo).

## Scripts

```bash
npm run dev
npm run build
```

## Variables

Ver `.env.example`.
