# Substitute List

MVP para registro de mazos Pokémon TCG Standard en League Cups y Challenges locales.

## Funciones

- **Jugadores:** enviar lista por enlace del torneo, validación en vivo de 60 cartas (formato TCG Live en inglés), enlace personal para ver/editar, solo lectura tras la hora límite.
- **Tienda:** inicio de sesión, un torneo abierto a la vez, bandeja de listas recibidas, URL pública para compartir.

## Configuración

1. Instala [MongoDB](https://www.mongodb.com/try/download/community) local o usa MongoDB Atlas.

2. Copia el archivo de entorno:

```bash
cp .env.example .env.local
```

Edita `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` y un `SESSION_SECRET` aleatorio largo.

3. Instala y ejecuta:

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Uso

1. Entra en `/admin/login` con las credenciales de `.env.local`.
2. Crea un torneo (la hora límite de listas debe ser **antes** del inicio del torneo).
3. Comparte la URL de jugadores: `/e/{slug}`.
4. Tras enviar, el jugador recibe su enlace: `/e/{slug}/deck/{token}`.

## Stack

- Next.js 16 (App Router), React, Tailwind CSS
- MongoDB + Mongoose
- Cookie de sesión firmada para el admin

## Despliegue en Vercel

1. Importa el repositorio [SustituteList](https://github.com/Batery001/SustituteList) en [Vercel](https://vercel.com).
2. En **Settings → Environment Variables**, añade:

| Variable | Descripción |
|----------|-------------|
| `MONGODB_URI` | URI de MongoDB Atlas (recomendado en producción) |
| `ADMIN_EMAIL` | Correo del admin |
| `ADMIN_PASSWORD` | Contraseña del admin |
| `SESSION_SECRET` | Cadena aleatoria larga (32+ caracteres) |
| `STORE_NAME` | Nombre de la tienda |
| `STORE_TIMEZONE` | Ej. `America/Mexico_City` |

3. Despliega. La tienda se crea en el primer login con esas credenciales.

## Pendiente

- Validación de marcas de regulación vía API
- Export PDF TPCi e impresión
- Modo offline (PWA)
- Recuperación de enlace con Pop ID + fecha de nacimiento
