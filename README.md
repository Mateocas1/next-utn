# Chat API — Trabajo Final Integrador Node.js

Este proyecto es el backend de un clon de chat desarrollado con **Node.js**, **Express**, **TypeScript** y **MongoDB**.  
La idea fue cumplir la consigna del trabajo y, al mismo tiempo, llevar la implementación a un nivel más sólido en arquitectura, validación, resiliencia y testing.

---

## Qué es este proyecto

Es una API para manejar:

- usuarios
- chats
- mensajes
- notificaciones

La API permite crear usuarios, autenticarse, iniciar chats entre usuarios, enviar mensajes, consultar historial y emitir eventos en tiempo real mediante WebSockets.

---

## URLs importantes

- **Backend deployado (Railway):** `https://next-utn-production.up.railway.app`
- **Healthcheck:** `https://next-utn-production.up.railway.app/health`
- **Raíz del backend:** `https://next-utn-production.up.railway.app/`
- **Desarrollo local:** `http://localhost:3000`

---

## Stack tecnológico

- **Node.js**
- **Express**
- **TypeScript**
- **MongoDB + Mongoose**
- **Redis**
- **Socket.IO**
- **Zod**
- **JWT**

---

## Instalación local

### Requisitos previos

Antes de levantar el proyecto necesitás tener instalado:

- Node.js 18 o superior
- MongoDB
- Redis

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPO>
cd finalNodeJS
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear archivo de entorno

Copiá `.env.example` a `.env` y completá los valores necesarios.

Ejemplo:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/chat-api
REDIS_URL=redis://localhost:6379
JWT_SECRET=tu_secreto_super_seguro_para_jwt
JWT_EXPIRES_IN=24h
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60
IDEMPOTENCY_TTL=86400
CORS_ORIGIN=http://localhost:5173
```

### 4. Levantar el proyecto en desarrollo

```bash
npm run dev
```

### 5. Ejecutar tests

```bash
npm test
```

---

## Deploy

### Deploy local

Para desarrollo, el backend corre en:

`http://localhost:3000`

El healthcheck local queda disponible en:

`http://localhost:3000/health`

### Deploy web

El proyecto está desplegado en Railway en:

`https://next-utn-production.up.railway.app`

Para validar que está corriendo correctamente:

- `GET /`
- `GET /health`

---

## Formato general de respuesta

La API responde con un formato consistente:

```json
{
  "success": true,
  "data": {}
}
```

Cuando hay paginación, la metadata va al nivel superior:

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

---

## Endpoints principales

## Users

### `POST /users`
Crea un usuario nuevo.

Compatibilidad legacy disponible también en `POST /users/register`.

#### Request

```json
{
  "email": "user@example.com",
  "displayName": "Juan Perez",
  "password": "Password123!"
}
```

#### Response

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

### `POST /users/login`
Inicia sesión y devuelve token JWT.

#### Request

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

#### Response

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

### `GET /users`
Lista usuarios disponibles.

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-v4",
      "email": "user@example.com",
      "displayName": "Juan Perez",
      "createdAt": "2023-10-25T10:00:00.000Z"
    }
  ]
}
```

### `DELETE /users/:id`
Elimina un usuario.

Requiere:

`Authorization: Bearer <token>`

#### Response

`204 No Content`

#### Qué resuelve este endpoint

El borrado no se limita a eliminar la fila del usuario. También elimina de forma transaccional:

- los mensajes del usuario
- las notificaciones del usuario
- su participación en chats
- los chats que queden vacíos

Y, si el chat sigue existiendo, recalcula el `latestMessagePreview`.

---

## Chats

Requieren:

`Authorization: Bearer <token>`

### `POST /chats`
Crea un chat 1:1 entre el usuario autenticado y otro usuario seleccionado.

#### Request

```json
{
  "recipientId": "uuid-user-2"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid-chat",
    "participants": ["uuid-user-1", "uuid-user-2"],
    "createdAt": "2023-10-25T10:05:00.000Z",
    "updatedAt": "2023-10-25T10:05:00.000Z"
  }
}
```

#### Qué resuelve este endpoint

Este cambio fue importante porque antes el backend no creaba realmente un chat con el destinatario seleccionado. Ahora el flujo “nuevo chat” queda coherente entre backend y frontend.

### `GET /chats?limit=10&cursor=...`
Lista chats del usuario autenticado.

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-chat",
      "participants": ["uuid-user-1", "uuid-user-2"],
      "latestMessagePreview": "Hola, ¿cómo estás?",
      "updatedAt": "2023-10-25T10:10:00.000Z"
    }
  ],
  "meta": {
    "nextCursor": "base64_encoded_next_cursor",
    "limit": 10
  }
}
```

---

## Messages

Requieren:

`Authorization: Bearer <token>`

### `POST /messages`
Envía un mensaje dentro de un chat.

#### Request

```json
{
  "chatId": "uuid-chat",
  "content": "Hola, ¿cómo estás?"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid-message",
    "chatId": "uuid-chat",
    "senderId": "uuid-user-1",
    "content": "Hola, ¿cómo estás?",
    "createdAt": "2023-10-25T10:10:00.000Z"
  }
}
```

### `GET /messages?chatId=uuid-chat&limit=20&cursor=...`
Devuelve historial de mensajes del chat.

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-message",
      "chatId": "uuid-chat",
      "senderId": "uuid-user-1",
      "content": "Hola, ¿cómo estás?",
      "createdAt": "2023-10-25T10:10:00.000Z"
    }
  ],
  "meta": {
    "nextCursor": "base64_encoded_next_cursor",
    "limit": 20
  }
}
```

#### Qué resuelve este endpoint

Acá se corrigió una fuga de entidades internas del dominio. Antes podían aparecer estructuras no aptas para frontend; ahora el historial devuelve DTOs planos y consistentes.

### `POST /messages/typing`
Emite la señal de “usuario escribiendo”.

#### Request

```json
{
  "chatId": "uuid-chat",
  "isTyping": true
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

---

## Notifications

Requieren:

`Authorization: Bearer <token>`

### `GET /notifications`
Lista notificaciones del usuario.

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-notification",
      "userId": "uuid-user",
      "title": "Nuevo mensaje",
      "message": "Tienes un nuevo mensaje",
      "read": false,
      "createdAt": "2023-10-25T10:15:00.000Z",
      "metadata": {
        "chatId": "uuid-chat",
        "senderId": "uuid-sender"
      }
    }
  ]
}
```

### `PATCH /notifications/:id/read`
Marca una notificación como leída.

---

## WebSockets

La API soporta Socket.IO para eventos en tiempo real.

### Handshake

```json
{
  "auth": {
    "token": "<JWT_TOKEN>"
  }
}
```

### Eventos cliente → servidor
- `joinChat`
- `leaveChat`

### Eventos servidor → cliente
- `message`
- `typing`
- `notification`

---

## Cómo consumir la API desde React

### Axios

```ts
import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://next-utn-production.up.railway.app'
});
```

### Socket.IO

```ts
import { io } from 'socket.io-client';

const socket = io('https://next-utn-production.up.railway.app', {
  auth: {
    token: localStorage.getItem('token')
  }
});
```

### Typing desde frontend

```ts
await api.post('/messages/typing', {
  chatId,
  isTyping: true
});
```

---

## Qué cumple de la consigna

### Requisitos mínimos
- servidor con Express
- rutas organizadas
- middlewares
- `/users`, `/chats`, `/messages`
- conexión a MongoDB
- respuestas estandarizadas
- integración con frontend
- manejo de errores

### Bonus
- JWT
- Zod
- paginación
- `.env`

---

## Qué se agregó además de la consigna y del bonus

Además de cumplir lo pedido, el proyecto incorpora:

- Clean Architecture
- DTOs explícitos
- borrado en cascada transaccional
- WebSockets con Socket.IO
- Redis adapter con degradación segura
- rate limiting
- idempotencia
- circuit breaker
- suite de tests amplia y verde
- alineación contractual real backend ↔ frontend

### Qué resuelven estos agregados

- **DTOs**: evitan filtrar entidades internas al frontend
- **cascade delete**: mantiene coherencia al borrar usuarios
- **rate limiting / idempotencia / circuit breaker**: hacen la API más robusta
- **WebSockets**: permiten feedback en tiempo real
- **tests amplios**: reducen regresiones y hacen la entrega más defendible

---

## Qué entregar

Para una entrega prolija, conviene presentar:

1. el repositorio GitHub del backend
2. este `README.md`
3. `.env.example`
4. la URL deployada en Railway
5. opcionalmente, el frontend como demostración de integración

---

## Estado final

El backend quedó **entregable respecto a la consigna** y además incorpora varias mejoras extra que no eran obligatorias, pero elevan la calidad técnica del trabajo.
