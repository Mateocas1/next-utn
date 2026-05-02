# Entrega — Trabajo Final Integrador Node.js

Profesor/a:

Le presento el **Trabajo Final Integrador de Desarrollo en Node.js**.  
El núcleo de la entrega es el **backend**, desarrollado con **Node.js, Express y MongoDB**, cumpliendo la consigna de una API para un clon de chat.

---

## 1. Qué se entrega

### Entrega principal
- **Repositorio backend** con la API completa
- **README.md** actualizado con instalación, ejecución, endpoints y ejemplos
- **API deployada públicamente**
- **Archivo `.env.example`** para configuración

### URL pública del backend
- **Railway:** `https://next-utn-production.up.railway.app`
- **Healthcheck:** `https://next-utn-production.up.railway.app/health`

### Material complementario
- Frontend en React como demostración de integración real con la API

---

## 2. Qué puntos de la consigna cumple este trabajo

### Servidor con Express.js
- ✅ Servidor implementado con Express
- ✅ Rutas organizadas
- ✅ Middlewares básicos y complementarios (`express.json`, auth, validación, manejo de errores, etc.)

### Endpoints solicitados
- ✅ `/users`
  - `POST /users`
  - `GET /users`
  - `DELETE /users/:id`
- ✅ `/chats`
  - `POST /chats`
  - `GET /chats`
- ✅ `/messages`
  - `POST /messages`
  - `GET /messages`
  - `POST /messages/typing`

### MongoDB
- ✅ Conexión funcional a MongoDB
- ✅ Colecciones separadas para usuarios, chats y mensajes
- ✅ Relación entre mensajes, chats y usuarios (`chatId`, `senderId`)

### Respuestas estandarizadas
- ✅ Formato uniforme basado en `{ success, data, ... }`
- ✅ Paginación y metadatos consistentes donde corresponde

### Integración con frontend
- ✅ El backend está preparado para ser consumido desde React
- ✅ El contrato entre frontend y backend fue alineado y probado

### Buenas prácticas
- ✅ Separación modular del código
- ✅ Manejo de errores centralizado
- ✅ Variables de entorno
- ✅ Testing automatizado

---

## 3. Bonus cubiertos

Además de los mínimos, este trabajo incluye los bonus pedidos:

- ✅ Autenticación con JWT
- ✅ Validaciones con Zod
- ✅ Paginación en endpoints
- ✅ Uso de `.env`

---

## 4. Agregados extra por encima de la consigna

Además de lo solicitado y del bonus, se implementaron mejoras técnicas adicionales:

- Clean Architecture / separación fuerte de responsabilidades
- Borrado físico en cascada transaccional al eliminar usuarios
- WebSockets con Socket.IO
- Redis adapter con degradación segura
- Rate limiting
- Idempotencia
- Circuit breaker
- DTOs para evitar filtrar entidades internas del dominio
- Suite de tests amplia y en verde
- Alineación contractual real entre backend y frontend

---

## 5. Cómo conviene evaluarlo o probarlo

### Rutas principales para probar
- `POST /users`
- `GET /users`
- `DELETE /users/:id`
- `POST /users/login`
- `POST /chats`
- `GET /chats`
- `POST /messages`
- `GET /messages?chatId=<id>`
- `POST /messages/typing`

### Recomendación de revisión
Si se desea evaluar únicamente la parte estrictamente pedida en la consigna, el **backend por sí solo ya resulta entregable**.

El frontend puede considerarse como una **demostración adicional de integración** y no como condición necesaria para validar el cumplimiento del backend.

---

## 6. Veredicto de entregabilidad

### Backend
**✅ Entregable respecto a la consigna del trabajo**

### Frontend
**➕ Complemento adicional para demo e integración**, no indispensable para validar el backend.

---

## 7. Resumen breve para la presentación oral

> El trabajo cumple con la consigna del backend usando Express, MongoDB y endpoints para usuarios, chats y mensajes. Además incorpora autenticación JWT, validación con Zod, paginación, variables de entorno y mejoras extra de arquitectura, testing y resiliencia.
