# Chat API — Trabajo Final Integrador Node.js (UTN)

Este repositorio es el **backend** de un clon de chat. Implementa una API REST con Node.js/Express y MongoDB, y suma tiempo real con Socket.IO. La idea no fue “poner todo junto y que funcione”, sino **separar responsabilidades** para que el código sea mantenible y fácil de explicar en la defensa.

La consigna pide usuarios, chats y mensajes; este backend los cubre con respuestas consistentes, validación de entrada y una capa de autenticación. Además, usa eventos de dominio para disparar notificaciones y para el tiempo real.

---

## 🔗 URLs públicas

- **Backend (Railway):** `https://next-utn-production.up.railway.app`
- **Healthcheck:** `https://next-utn-production.up.railway.app/health`
- **Local:** `http://localhost:3000`

> Si alguna URL cambia, actualizala en esta sección.

---

## 🚀 Cómo correr el proyecto

### Requisitos

- Node.js 18+
- MongoDB en local o remoto
- Redis (se usa para rate limiting, idempotencia y el adapter de Socket.IO)

### Instalación

```bash
npm install
```

### Variables de entorno

Copiá `.env.example` a `.env` y completá valores. Ejemplo:

```env
MONGO_URI=mongodb://localhost:27017/chat
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=super-secret-jwt-key-that-is-at-least-32-characters-long
JWT_EXPIRES_IN=7d
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60
IDEMPOTENCY_TTL=86400
PORT=3000
CORS_ORIGIN=http://localhost:3000
```

### Levantar en desarrollo

```bash
npm run dev
```

### Tests

Para verificar el backend antes de entregar:

```bash
npm run typecheck
npm test
npm run test:e2e
```

---

## 📦 Formato de respuesta

Todas las respuestas siguen el mismo contrato:

```json
{
  "success": true,
  "data": {}
}
```

Cuando hay paginación:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "nextCursor": "...",
    "limit": 20
  }
}
```

Errores:

```json
{
  "success": false,
  "data": null,
  "message": "...",
  "errorCode": "...",
  "details": []
}
```

---

## 🔐 Autenticación

Se usa JWT. El token se envía en el header:

```
Authorization: Bearer <token>
```

Las rutas de **chats**, **messages** y **notifications** lo requieren.

---

## 📚 Endpoints

> Base URL: `https://next-utn-production.up.railway.app`

### Users

#### `POST /users`
Registro de usuario.

```json
{
  "email": "user@example.com",
  "displayName": "Juan Perez",
  "password": "Password123!"
}
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "displayName": "Juan Perez",
    "createdAt": "2023-10-25T10:00:00.000Z"
  }
}
```

> También existe `POST /users/register` por compatibilidad.

#### `POST /users/login`
Login y emisión de token JWT.

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "uuid-v4",
      "email": "user@example.com",
      "displayName": "Juan Perez"
    }
  }
}
```

#### `GET /users`
Lista de usuarios.

#### `DELETE /users/:id`
Borrado de usuario (requiere auth).

```
Authorization: Bearer <token>
```

Devuelve `204 No Content`.

---

### Chats (requieren auth)

#### `POST /chats`
Crea un chat 1:1.

```json
{
  "recipientId": "uuid-user-2"
}
```

#### `GET /chats?limit=10&cursor=...`
Lista de chats con paginación por cursor.

#### `GET /chats/:chatId`
Detalle de un chat.

---

### Messages (requieren auth)

#### `POST /messages`
Envía un mensaje. Soporta **idempotencia** con header opcional:

```
Idempotency-Key: <uuid>
```

```json
{
  "chatId": "uuid-chat",
  "content": "Hola, ¿cómo estás?"
}
```

#### `GET /messages?chatId=uuid-chat&limit=20&cursor=...`
Historial paginado de mensajes.

#### `POST /messages/typing`
Emite evento de “usuario escribiendo”.

```json
{
  "chatId": "uuid-chat",
  "isTyping": true
}
```

---

### Notifications (requieren auth)

#### `GET /notifications`
Lista notificaciones.

#### `PATCH /notifications/:id/read`
Marca una notificación como leída.

---

## ⚡ Tiempo real (Socket.IO)

El backend soporta WebSockets con Socket.IO.

### Handshake

```json
{
  "auth": {
    "token": "<JWT_TOKEN>"
  }
}
```

### Eventos cliente → servidor

- `joinChat` (chatId)
- `leaveChat` (chatId)

### Eventos servidor → cliente

- `message`
- `typing`
- `notification`

Si Redis no está disponible, Socket.IO **degrada a modo single-node** y sigue funcionando (sin sincronización multi-instancia).

---

## 🧩 Cómo lo consume un frontend React

En este repo hay utilidades de consumo en `src/lib/axios.ts` y `src/features/*/api`.

### Axios (con JWT + idempotencia)

```ts
import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://next-utn-production.up.railway.app'
});
```

En el proyecto, el interceptor agrega:
- `Authorization: Bearer <token>` si hay sesión.
- `Idempotency-Key` automático en POST.

### Socket.IO

```ts
import { io } from 'socket.io-client';

const socket = io('https://next-utn-production.up.railway.app', {
  auth: { token: localStorage.getItem('token') }
});
```

---

## 🏗️ Arquitectura (resumen honesto)

El proyecto está organizado en capas **Domain / Application / Infrastructure / Presentation**:

- **Domain**: entidades, eventos y reglas de negocio puras.
- **Application**: casos de uso y puertos (interfaces).
- **Infrastructure**: Mongo, Redis, Socket.IO, JWT, repositorios concretos.
- **Presentation**: Express, controladores, middlewares, rutas.

¿Tradeoff? Es más verboso que un “CRUD directo”, pero a cambio es más fácil testear, aislar dependencias y explicar el porqué de cada pieza.

---

## ✅ Qué resuelve cada agregado (verificado en código)

- **JWT**: protege endpoints y handshake de Socket.IO.
- **Validación con Zod**: schemas en `src/presentation/schemas`.
- **Paginación por cursor**: chats y mensajes usan `cursor` + `limit`.
- **Rate limiting**: middleware global con Redis.
- **Idempotencia**: POST /chats y POST /messages aceptan `Idempotency-Key`.
- **Circuit breaker**: bloquea requests si Mongo/Redis reportan estado `OPEN`.
- **WebSockets + Redis adapter**: tiempo real con fallback a single-node.
- **Eventos de dominio**: mensajes y notificaciones se publican vía EventBus.

Si algo no está en código, no lo vas a ver acá. La idea es **documentar solo lo verificable**.

---

## 🧾 Cómo revisar la entrega (mapeo a la consigna)

1) **API REST con Express + MongoDB**
   - Endpoints `/users`, `/chats`, `/messages`.
   - Conexión MongoDB en `src/infrastructure/database`.

2) **Respuestas estandarizadas**
   - `successResponse` / `errorResponse` en `src/presentation/utils/response`.

3) **Estructura en capas / controladores / rutas**
   - `src/presentation/routes` y `controllers`.
   - Capas separadas (Domain / Application / Infrastructure / Presentation).

4) **Integración con frontend**
   - Ejemplos de consumo con Axios + Socket.IO.

5) **Bonus**
   - JWT, Zod, paginación por cursor, `.env`, rate limiting, idempotencia.

Si querés una revisión rápida: levantá el proyecto, probá `/health`, registrá un usuario, hacé login, creá un chat, enviá mensajes y verificá el historial con cursor.

---

## 📎 Notas finales

Este README intenta explicar las decisiones principales del proyecto y cómo probarlo. Si algo genera duda, lo mejor es mirar el código y validar los endpoints con Postman, Insomnia o `curl`.
