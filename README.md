# Chat API - Trabajo Final Integrador Node.js

API RESTful para un clon de chat, desarrollada con **Node.js**, **TypeScript**, **Express** y **MongoDB**.  
El proyecto cumple la consigna del Trabajo Final Integrador y además suma mejoras de arquitectura, validación, resiliencia y testing.

---

## URLs

- **Producción (Railway):** `https://next-utn-production.up.railway.app`
- **Healthcheck:** `https://next-utn-production.up.railway.app/health`
- **Desarrollo local:** `http://localhost:3000`

---

## Tecnologías

- Node.js
- Express
- TypeScript
- MongoDB + Mongoose
- Redis
- Socket.IO
- Zod
- JWT

---

## Características principales

- Rutas sin prefijo `/api`, alineadas a la consigna
- CRUD mínimo de usuarios
- Chats 1:1 con destinatario explícito
- Historial de mensajes con DTOs planos
- Validación con Zod
- Autenticación con JWT
- Paginación por cursor
- WebSockets para eventos realtime
- Rate limiting, idempotencia y circuit breaker
- Tests unitarios, integración y E2E

---

## Instalación y ejecución

### Requisitos previos
- Node.js 18+
- MongoDB
- Redis

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar entorno
Copiar `.env.example` a `.env` y completar valores.

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

### 3. Levantar en desarrollo
```bash
npm run dev
```

### 4. Ejecutar tests
```bash
npm test
```

---

## Formato de respuesta

La API responde con envelope consistente:

```json
{
  "success": true,
  "data": {}
}
```

En endpoints paginados, la metadata va a nivel superior:

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

## Endpoints

## Users

### Crear usuario
`POST /users`

Compatibilidad legacy también disponible en `POST /users/register`.

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

### Login
`POST /users/login`

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

### Listar usuarios
`GET /users`

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

### Eliminar usuario
`DELETE /users/:id`

Requiere `Authorization: Bearer <token>`

#### Response
`204 No Content`

#### Comportamiento
El borrado es físico y en cascada. Elimina:
- usuario
- mensajes del usuario
- notificaciones del usuario
- participación en chats
- chats que queden vacíos

Además recalcula `latestMessagePreview` en chats que continúan activos.

---

## Chats

Requieren `Authorization: Bearer <token>`

### Crear chat
`POST /chats`

Soporta `Idempotency-Key` opcional.

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

### Listar chats
`GET /chats?limit=10&cursor=base64_string`

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

Requieren `Authorization: Bearer <token>`

### Enviar mensaje
`POST /messages`

Soporta `Idempotency-Key` opcional.

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

### Obtener historial
`GET /messages?chatId=uuid-chat&limit=20&cursor=base64_string`

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

### Typing signal
`POST /messages/typing`

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

Requieren `Authorization: Bearer <token>`

### Listar notificaciones
`GET /notifications`

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

### Marcar como leída
`PATCH /notifications/:id/read`

#### Response
```json
{
  "success": true,
  "data": {
    "id": "uuid-notification",
    "read": true
  }
}
```

---

## WebSockets

La API soporta Socket.IO para eventos realtime.

### Handshake
Enviar token JWT en:

```json
{
  "auth": {
    "token": "<JWT_TOKEN>"
  }
}
```

### Eventos cliente → servidor
- `joinChat` → `{ chatId }`
- `leaveChat` → `{ chatId }`

### Eventos servidor → cliente
- `message`
- `typing`
- `notification`

---

## Integración con frontend

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

- Servidor Express con rutas organizadas
- CRUD base de usuarios, chats y mensajes
- Persistencia en MongoDB
- Respuestas estandarizadas
- Integración con frontend
- Buenas prácticas y modularidad

---

## Bonus incluidos

- JWT
- Zod
- Paginación
- `.env`

---

## Agregados extra

- Clean Architecture
- DTOs explícitos
- Borrado transaccional en cascada
- WebSockets
- Redis adapter con degradación segura
- Rate limiting
- Idempotencia
- Circuit breaker
- Testing amplio

---

## Nota final

El backend quedó preparado para ser evaluado como entrega principal del TFI, y además dispone de integración real con un frontend React como complemento de demostración.
