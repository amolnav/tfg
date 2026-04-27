# 🍽️ Restaurant Management System (TFG)

[![License: All Rights Reserved](https://img.shields.io/badge/License-All_Rights_Reserved-red.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-19.0.0-blue)](https://reactjs.org/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748)](https://www.prisma.io/)

Una solución integral y moderna para la gestión de reservas, clientes y operaciones de un restaurante. Este proyecto ha sido desarrollado como un **Trabajo de Fin de Grado (TFG)**, enfocándose en la escalabilidad, la experiencia de usuario y la eficiencia operativa.

---

## 📖 Documentación del Proyecto

Este repositorio contiene la documentación completa necesaria para el Trabajo de Fin de Grado. Puedes consultar los detalles en los siguientes enlaces:

- 📜 [**Memoria Técnica Completa (TFG_REPORT.md)**](./docs/TFG_REPORT.md) - *Documento principal con toda la información requerida.*
- ⚙️ [**README del Backend**](./backend/README.md) - *Instalación y detalles técnicos de la API.*
- 🎨 [**README del Frontend**](./frontend/README.md) - *Instalación y detalles técnicos de la interfaz.*
- 🏛️ [Arquitectura del Sistema](./docs/ARCHITECTURE.md)
- 🗄️ [Detalle del Esquema de BD](./docs/DATABASE_SCHEMA.md)

---

## 🎯 Resumen y Propósito
El **Sistema de Gestión de Restaurantes** es una plataforma diseñada para centralizar la operativa de un restaurante. Permite a los clientes realizar reservas online y a los administradores gestionar el local, las mesas, los turnos y la base de datos de clientes de forma eficiente y en tiempo real.

---

## 🛠️ Tecnologías Utilizadas
- **Backend:** Node.js, Express, PostgreSQL, Prisma ORM, Socket.io, JWT.
- **Frontend:** React 19, Vite, TypeScript, i18next, Tailwind CSS / Vanilla CSS.
- **Infraestructura:** Docker, Docker Compose, pgAdmin.

---

## 👥 Roles y Casos de Uso
El sistema está diseñado para tres tipos de usuarios:

1. **Cliente (Público):**
   - Realizar reservas y consultar disponibilidad.
   - Consultar el menú interactivo multilingüe.
2. **Personal (Staff):**
   - Controlar el flujo de comensales en tiempo real.
   - Asignar mesas y gestionar estados de reserva.
   - Consultar perfiles de clientes y alérgenos.
3. **Administrador:**
   - Configurar la estructura del local (Zonas/Mesas).
   - Definir horarios, turnos y cierres.
   - Gestionar el menú y los usuarios del sistema.

---

## 🏗️ Arquitectura del Sistema

El proyecto sigue una arquitectura desacoplada de Cliente-Servidor:

- **Backend:** API REST robusta construida con **Node.js** y **Express**, utilizando **Prisma ORM** para la interacción con la base de datos PostgreSQL.
- **Frontend:** Aplicación web reactiva construida con **React 19** y **Vite**, utilizando **TypeScript** para mayor seguridad y mantenibilidad.
- **Comunicación en Tiempo Real:** Implementación de **Socket.io** para actualizaciones instantáneas entre el portal de clientes y el panel de administración.

```mermaid
graph TD
    A[Cliente Web] <--> B[Frontend - React]
    B <--> C[Backend - Express API]
    C <--> D[(PostgreSQL - Prisma)]
    C <--> E[Socket.io Server]
    B <--> E
```

---

## 🗄️ Modelo de Datos y Tablas

El sistema utiliza un modelo relacional centrado en la eficiencia operativa.

### Diagrama ER (Resumen)
```mermaid
erDiagram
    CUSTOMER ||--o{ BOOKING : "realiza"
    TABLE ||--o{ BOOKING : "asignada a"
    ZONE ||--o{ TABLE : "contiene"
    SHIFT ||--o{ CLOSURE : "afecta"
    MENUCATEGORY ||--o{ MENUITEM : "contiene"
```

### Tablas Principales
- **Customer:** CRM y fidelización.
- **Booking:** Gestión de reservas y estados.
- **Table / Zone:** Infraestructura física del local.
- **Shift / Closure:** Control de disponibilidad horaria.
- **Staff:** Gestión de accesos.

---

## 📦 Instalación y Configuración

### Requisitos Previos
- Node.js (>= 18.0.0)
- Docker & Docker Compose (Recomendado para la base de datos)
- npm o yarn

### Pasos Generales
1. **Clonar el repositorio:**
   ```bash
    git clone https://github.com/Amolnav/TFG
    cd TFG
   ```

2. **Configurar variables de entorno:**
   Copia los archivos `.env.example` (si existen) o crea archivos `.env` en la raíz, `/backend` y `/frontend`.

3. **Levantar la infraestructura (Base de Datos):**
   ```bash
   docker-compose up -d
   ```

4. **Instalar dependencias y ejecutar:**
   Sigue las instrucciones detalladas en cada subdirectorio:
   - [Documentación del Backend](./backend/README.md)
   - [Documentación del Frontend](./frontend/README.md)

---

## 📁 Estructura del Proyecto

```text
.
├── backend/                # API, Base de Datos y Lógica de Servidor -> [Ver README](./backend/README.md)
├── frontend/               # Interfaz de Usuario y Lógica Cliente -> [Ver README](./frontend/README.md)
├── docs/                   # Documentación detallada del sistema
├── specs/                  # Especificaciones técnicas y planes de desarrollo
├── docker-compose.yml      # Configuración de Docker (Desarrollo)
├── docker-compose.prod.yml # Configuración de Docker (Producción)
├── testapi.sh              # Script de prueba para la API
└── LICENSE                 # Licencia del proyecto
```

---

## 🚀 Despliegue (Estado Actual)

> [!IMPORTANT]
> **Despliegue objetivo:** el proyecto puede desplegarse separando frontend y backend en Render.
> 
> **Configuración recomendada:**
> - **Frontend:** Render Static Site
> - **Backend:** Render Web Service
> - **Database:** Render PostgreSQL

---

## 📸 Capturas de Pantalla

<table>
  <tr>
    <td><img src="frontend/public/img/HomeExample.png" width="400"/><br/><sub>Portal Público - Home</sub></td>
    <td><img src="frontend/public/img/AdminExample.png" width="400"/><br/><sub>Panel de Administración</sub></td>
  </tr>
</table>

---

## 📜 Licencia

Este proyecto está bajo la protección de **Todos los derechos reservados**. Consulta el archivo [LICENSE](LICENSE) para más detalles.
