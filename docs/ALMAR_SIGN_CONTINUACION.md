# ALMAR Sign — Documento maestro de continuidad

## Proyecto inicial

Nombre: ALMAR Sign

Tipo: app móvil profesional de control horario con GPS.

Stack obligatorio:
- Frontend: Expo + React Native + TypeScript
- Backend: FastAPI
- Base de datos: MongoDB Atlas
- Pruebas: Expo Go

Regla crítica:
ALMAR_CONTROL_V2 queda congelado.
No se toca.
No se reutiliza.
No se mezcla.

Objetivo v0.1:
Empleado abre móvil → login → GPS → ficha entrada/salida → guardado real en Mongo → admin lo ve.

## Arquitectura

ALMAR_SIGN/
├── backend/
├── frontend/
├── assets/
├── docs/
├── checkpoints/
└── README.md

## Estado actual

Último checkpoint:
checkpoint-13: admin dashboard operativo

Funcionando:
- FastAPI operativo
- Expo Go operativo
- navegación completa
- login worker/admin
- GPS real
- dentro/fuera zona
- bloqueo fuera de zona
- entrada/salida
- anti doble entrada
- anti doble salida
- Mongo Atlas persistente
- historial real
- admin dashboard
- horas acumuladas simples

## Backend actual

Endpoints:
- GET /health
- POST /auth/login
- POST /records/check-in
- POST /records/check-out
- GET /records
- GET /settings/gps
- GET /admin/records
- GET /admin/hours/{email}
- GET /admin/summary

Mongo:
DATABASE_NAME=almar_sign

## Frontend actual

Pantallas:
- SplashScreen
- LoginScreen
- WorkerHomeScreen
- HistoryScreen
- AdminScreen

API actual:
http://192.168.1.37:8000

Si cambia la IP del Mac, actualizar:
- frontend/src/api/client.ts
- frontend/src/screens/AdminScreen.tsx

Usuarios demo:
- worker@almar.com / 123456
- admin@almar.com / 123456

## Siguiente paso recomendado

Export CSV real desde admin.

Objetivo:
Admin → exportar registros CSV → archivo usable para empresa/gestoría.

## Reglas de trabajo

- No tocar ALMAR_CONTROL_V2
- No reconstruir sin motivo
- Cambios pequeños
- Código completo
- Comandos terminal claros
- Preferir sobrescribir archivos completos si hay riesgo de error
- Mantener Git checkpoints
- No pegar credenciales reales en chat
- No usar localhost para móvil físico
- No simular GPS
- No guardar coordenadas 0,0

## Prompt para nuevo hilo

Continuamos proyecto ALMAR Sign.

Estado actual:
- Expo + React Native + TypeScript
- FastAPI backend
- MongoDB Atlas conectado
- GPS real funcionando
- check-in/check-out funcionando
- historial Mongo funcionando
- admin dashboard funcionando
- bloqueo fuera zona funcionando
- horas acumuladas funcionando

Estructura:
backend/ separado
frontend/ separado

Mongo:
DATABASE_NAME=almar_sign

Backend frontend:
http://192.168.1.37:8000

Último checkpoint:
checkpoint-13: admin dashboard operativo

Prioridad siguiente:
EXPORT CSV real desde admin.

Trabajar SIEMPRE:
- cambios pequeños
- código completo
- comandos terminal completos
- evitar romper archivos
- preferir sobrescribir archivo completo
- mantener checkpoints Git
- mantener Expo estable
