# Chat API - Trabajo Final Integrador Node.js

Una API RESTful robusta y escalable para un clon de chat, construida con Node.js, TypeScript, Express y MongoDB. Este proyecto no solo cumple con los requisitos básicos del Trabajo Final Integrador, sino que implementa patrones de arquitectura avanzada y resiliencia dignos de un entorno de producción real.

## 🚀 Características Principales

- **Clean Architecture**: Separación estricta en capas (Domain, Application, Infrastructure, Presentation).
- **TypeScript Estricto**: Tipado fuerte, sin `any`, y uso de *Branded Types* para IDs.
- **MongoDB Avanzado**: Transacciones ACID y Optimistic Locking para evitar condiciones de carrera.
- **Paginación por Cursor**: Búsquedas O(log n) ultra rápidas para historiales de chat largos.
- **Resiliencia**: Rate Limiting (Sliding Window), Idempotencia y Circuit Breakers respaldados por Redis.
- **Validación Robusta**: Zod para validación de esquemas en todas las entradas.
- **Testing Exhaustivo**: 283 tests (Unitarios, Integración y E2E) desarrollados bajo Strict TDD.

---

## 🛠️ Instalación y Ejecución

### Requisitos Previos
- Node.js (v18 o superior)
- MongoDB (Local o Atlas)
- Redis (Local o Docker)

### Pasos de Instalación

1. Clonar el repositorio e instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
Copiar el archivo `.env.example` a `.env` y ajustar los valores:
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/chat-api
REDIS_URL=redis://localhost:6379
JWT_SECRET=tu_secreto_super_seguro_para_jwt
JWT_EXPIRES_IN=24h
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60
IDEMPOTENCY_TTL=86400
```

3. Ejecutar en modo desarrollo:
```bash
npm run dev
```

4. Ejecutar tests:
```bash
npm test
```

---

## 📡 Endpoints y Ejemplos

Todas las respuestas siguen el formato estandarizado: `{ success: boolean, data: any, message?: string }`.

### Autenticación (`/users`)

#### Registrar Usuario
`POST /users/register`
```json
// Request Body
{
  "email": "user@example.com",
  "displayName": "Juan Perez",
  "password": "Password123!"
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "displayName": "Juan Perez",
    "createdAt": "2023-10-25T10:00:00Z"
  }
}
```

#### Iniciar Sesión
`POST /users/login`
```json
// Request Body
{
  "email": "user@example.com",
  "password": "Password123!"
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-v4",
      "email": "user@example.com",
      "displayName": "Juan Perez"
    }
  }
}
```

### Chats (`/chats`)
*Requieren header `Authorization: Bearer <token>`*

#### Crear Chat
`POST /chats`
*Soporta header opcional `Idempotency-Key`*
```json
// Request Body
{
  "participantIds": ["uuid-user-2"]
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "id": "uuid-chat",
    "participants": ["uuid-user-1", "uuid-user-2"],
    "createdAt": "2023-10-25T10:05:00Z",
    "updatedAt": "2023-10-25T10:05:00Z",
    "version": 0
  }
}
```

#### Listar Chats (Paginación por Cursor)
`GET /chats?limit=10&cursor=base64_string`
```json
// Response (200 OK)
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid-chat",
        "participants": ["uuid-user-1", "uuid-user-2"],
        "latestMessagePreview": "Hola, ¿cómo estás?",
        "updatedAt": "2023-10-25T10:10:00Z"
      }
    ],
    "nextCursor": "base64_encoded_next_cursor",
    "hasMore": false
  }
}
```

### Mensajes (`/messages`)
*Requieren header `Authorization: Bearer <token>`*

#### Enviar Mensaje
`POST /messages`
*Soporta header opcional `Idempotency-Key`*
```json
// Request Body
{
  "chatId": "uuid-chat",
  "content": "Hola, ¿cómo estás?"
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "id": "uuid-message",
    "chatId": "uuid-chat",
    "senderId": "uuid-user-1",
    "content": "Hola, ¿cómo estás?",
    "createdAt": "2023-10-25T10:10:00Z"
  }
}
```

#### Obtener Historial de Mensajes
`GET /messages/:chatId?limit=20&cursor=base64_string`
```json
// Response (200 OK)
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid-message",
        "chatId": "uuid-chat",
        "senderId": "uuid-user-1",
        "content": "Hola, ¿cómo estás?",
        "createdAt": "2023-10-25T10:10:00Z"
      }
    ],
    "nextCursor": "base64_encoded_next_cursor",
    "hasMore": false
  }
}
```

---

## 🔌 Integración con el Frontend (React)

Para consumir esta API desde un clon de chat en React, se recomienda configurar una instancia de Axios con interceptores para manejar el token JWT automáticamente:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Interceptor para inyectar el token en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Ejemplo de uso: Enviar un mensaje con Idempotencia
export const sendMessage = async (chatId, content) => {
  // Generar un UUID único para esta petición en el frontend
  const idempotencyKey = crypto.randomUUID(); 
  
  const response = await api.post('/messages', 
    { chatId, content },
    { headers: { 'Idempotency-Key': idempotencyKey } }
  );
  return response.data;
};
```

---

## 🏗️ Arquitectura Avanzada y Decisiones de Diseño

Este proyecto fue diseñado para escalar y soportar cargas de producción, yendo mucho más allá de un simple CRUD MVC.

### 1. Clean Architecture (Arquitectura Limpia)
El código está estrictamente separado en 4 capas: `Domain`, `Application`, `Infrastructure` y `Presentation`.
- **Problema que resuelve**: El acoplamiento fuerte. En un MVC clásico, la lógica de negocio se mezcla con Express o Mongoose.
- **Mejora**: Si mañana queremos cambiar Express por Fastify, o MongoDB por PostgreSQL, la lógica de negocio (Domain y Application) no se toca. Las dependencias apuntan siempre hacia adentro.

### 2. Transacciones ACID y Optimistic Locking (MongoDB)
Cuando se envía un mensaje, se debe guardar el mensaje Y actualizar el `latestMessagePreview` del chat.
- **Problema que resuelve**: Condiciones de carrera (Race conditions) e inconsistencia de datos si el servidor se cae a la mitad de la operación.
- **Mejora**: Usamos sesiones de MongoDB para garantizar que ambas operaciones ocurran juntas (Todo o Nada). Además, usamos el campo `__v` (Optimistic Locking) para evitar que dos usuarios actualicen el mismo chat simultáneamente y se pisen los datos.

### 3. Paginación por Cursor
En lugar de usar `skip` y `limit` (Offset pagination) para listar mensajes o chats.
- **Problema que resuelve**: El offset es `O(n)`. Si un chat tiene 100.000 mensajes, hacer `skip(99980)` obliga a la base de datos a escanear y descartar 99.980 documentos antes de devolver los 20 que pediste. Es lentísimo.
- **Mejora**: El cursor usa índices compuestos (`{ chatId: 1, createdAt: -1, id: -1 }`) para saltar directamente al último documento visto. Es `O(log n)`, manteniendo la misma velocidad sin importar el tamaño del historial.

### 4. Idempotencia (Redis)
Los endpoints POST (`/chats`, `/messages`) soportan el header `Idempotency-Key`.
- **Problema que resuelve**: Si un usuario manda un mensaje desde el celular, pero justo entra a un túnel y pierde señal, la app suele reintentar la petición. Esto genera mensajes duplicados en la base de datos.
- **Mejora**: Guardamos el hash de la petición en Redis. Si llega un reintento con la misma llave, devolvemos la respuesta cacheada (200 OK) sin volver a procesar ni guardar el mensaje en la DB.

### 5. Rate Limiting con Sliding Window (Redis)
- **Problema que resuelve**: Ataques de fuerza bruta, DDoS o usuarios abusando de la API.
- **Mejora**: Implementamos un algoritmo de *Sliding Window* usando *Sorted Sets* de Redis. Es mucho más preciso que el *Fixed Window* tradicional, evitando picos de tráfico en los bordes del minuto.

### 6. Circuit Breakers (Fail-Fast)
Las conexiones a MongoDB y Redis están envueltas en un Circuit Breaker.
- **Problema que resuelve**: Si la base de datos se cae, las peticiones HTTP se quedan colgadas esperando el timeout, saturando la memoria de Node.js hasta tirar el servidor completo (Cascading failure).
- **Mejora**: Si la DB falla repetidas veces, el circuito se "abre" y la API empieza a devolver `503 Service Unavailable` instantáneamente, protegiendo los recursos del servidor hasta que la DB se recupere.

### 7. Event-Driven Design (CQRS Light)
- **Problema que resuelve**: Tareas pesadas bloqueando la respuesta HTTP al usuario.
- **Mejora**: Al enviar un mensaje, la transacción principal solo guarda los datos. Luego, emite un evento de dominio (`MessageSentEvent`) en memoria. Esto permite que otros módulos (ej. un futuro servicio de Notificaciones Push o WebSockets) reaccionen al evento de forma asíncrona sin demorar la respuesta al cliente.

---

## 🔐 Password Requirements

The backend enforces the following password rules for security:
- Minimum **8 characters**.
- At least **1 uppercase letter** (e.g., `A`).
- At least **1 number** (e.g., `1`).
- At least **1 special character** (e.g., `!`, `@`, `#`).

**Frontend Recommendation**:
- Display these requirements in the registration/login form.
- Validate in real-time (e.g., with a checklist that activates as each requirement is met).
- Show clear error messages when validation fails (e.g., "Password must contain at least one special character").