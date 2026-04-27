# 🎨 Frontend - Interfaz de Usuario

Este directorio contiene la aplicación web del sistema, construida con **React 19**, **TypeScript** y **Vite**.

## 🛠️ Tecnologías Principales
- **Core:** React 19 + TypeScript
- **Gestión de Rutas:** React Router 7
- **Construcción:** Vite
- **Internacionalización:** i18next
- **Comunicación API:** Axios
- **WebSockets:** Socket.io-client
- **Drag & Drop:** dnd-kit

## 📦 Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar el archivo `.env`:**
    Crea un archivo `.env` en la raíz de `/frontend`:
    ```env
    VITE_API_URL="http://localhost:4000/api"
    VITE_SOCKET_URL="http://localhost:4000"
    ```

3. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

## 🚀 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo de Vite.
- `npm run build`: Compila la aplicación para producción.
- `npm run lint`: Ejecuta ESLint para verificar la calidad del código.
- `npm run test`: Ejecuta las pruebas unitarias con Vitest.

## 📁 Estructura de Carpetas

```text
src/
├── components/     # Componentes visuales organizados por dominio
├── context/        # Estado global (Autenticación, Idioma)
├── locales/        # Archivos de traducción (JSON)
├── pages/          # Vistas principales de la aplicación
├── services/       # Clientes de API (Axios instance)
├── styles/         # Archivos CSS globales y temas
├── tests/          # Pruebas unitarias y de integración
├── types/          # Definiciones de interfaces TypeScript
├── App.tsx         # Componente raíz y enrutamiento
├── main.tsx        # Punto de entrada de React
└── i18n.ts         # Configuración de internacionalización
```

## 🌍 Internacionalización (i18n)

La aplicación soporta tres idiomas: **Español**, **Inglés** y **Francés**.
Las traducciones se encuentran en `src/locales/`. Para añadir nuevos términos, asegúrate de actualizar los tres archivos JSON correspondientes.

## 🧪 Testing
Se utiliza **Vitest** y **React Testing Library** para asegurar la calidad de los componentes. Los tests se encuentran junto a sus respectivos componentes o en el directorio `src/tests`.

## Render

Para desplegar el frontend en Render como **Static Site**:

```env
VITE_API_URL="https://tu-backend.onrender.com/api"
VITE_SOCKET_URL="https://tu-backend.onrender.com"
```

Configura también una regla de rewrite para SPA hacia `index.html`.
