# 🎨 Sistema Completo de Galería de Imágenes con Supabase

Un sistema completo de subida, gestión y compartición de imágenes construido con Supabase. Incluye autenticación, sistema de valoraciones, comentarios, favoritos y mucho más.

## ✨ Características

- **🔐 Autenticación completa**: Registro y login con email/contraseña
- **🖼️ Subida de imágenes**: Compresión automática y validación
- **⭐ Sistema de valoraciones**: Calificaciones de 1-5 estrellas con comentarios
- **💬 Comentarios**: Sistema de comentarios para cada imagen
- **❤️ Favoritos**: Guarda tus imágenes favoritas
- **🔍 Búsqueda y filtrado**: Encuentra imágenes fácilmente
- **📱 Diseño responsive**: Funciona en desktop y móvil
- **🎨 UI moderna**: Interfaz elegante con modo oscuro
- **🔒 Seguridad**: Políticas RLS y validación robusta

## 🚀 Configuración Rápida

### 1. Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que se complete el provisioning

### 2. Configurar Base de Datos
1. Ve a **SQL Editor** en el dashboard de Supabase
2. Copia y pega el contenido de `sql/schema.sql`
3. Ejecuta el script completo

### 3. Configurar Storage
1. Ve a **Storage** → **Buckets**
2. Crea un nuevo bucket llamado `images` con visibilidad pública
3. Crea otro bucket llamado `avatars` con visibilidad pública

### 4. Configurar Autenticación
1. Ve a **Authentication** → **Settings**
2. Configura el sitio URL: `http://localhost:3000` (o tu dominio)
3. Habilita registro por email

### 5. Configurar Cliente Frontend
1. Ve a **Settings** → **API**
2. Copia la **URL** y la **clave anónima**
3. Actualiza `public/supabaseClient.js` con tus credenciales:

```javascript
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-clave-anon-aqui';
```

### 6. Ejecutar la Aplicación
```bash
# Con Python
python -m http.server 3000

# Con Node.js
npx serve public -p 3000

# Con PHP
php -S localhost:3000 -t public
```

Abre http://localhost:3000 en tu navegador.

## 📁 Estructura del Proyecto

```
supabase-image-upload-system/
├── public/
│   ├── index.html          # Página principal
│   ├── styles-enhanced.css # Estilos modernos
│   ├── app-enhanced.js     # Aplicación principal
│   ├── auth.js            # Gestión de autenticación
│   ├── gallery.js         # Gestión de galería
│   ├── utils.js           # Utilidades
│   ├── components.js      # Componentes UI
│   └── supabaseClient.js  # Cliente Supabase
├── sql/
│   └── schema.sql         # Esquema de base de datos
├── README.md
└── TODO.md
```

## 🗄️ Esquema de Base de Datos

### Tablas Principales
- `user_profiles` - Información adicional de usuarios
- `images` - Metadatos de imágenes subidas
- `ratings` - Valoraciones y comentarios
- `comments` - Comentarios independientes
- `favorites` - Imágenes favoritas
- `categories` - Categorías de imágenes
- `reports` - Sistema de reportes
- `followers` - Sistema de seguimiento

### Vistas
- `image_stats` - Estadísticas completas de imágenes

### Políticas RLS
Todas las tablas tienen políticas de Row Level Security configuradas para:
- Los usuarios solo pueden modificar sus propios datos
- Lectura pública donde corresponda
- Acceso administrativo para roles de servicio

## 🎯 Uso de la Aplicación

### Para Usuarios
1. **Registro**: Crea una cuenta con email y contraseña
2. **Subir imágenes**: Selecciona una imagen, añade título y categorías
3. **Explorar**: Navega por la galería, busca y filtra imágenes
4. **Interactuar**: Califica, comenta y guarda favoritos
5. **Gestionar**: Edita tu perfil y avatar

### Para Desarrolladores
La aplicación está construida con módulos ES6 modernos:
- `authManager` - Gestión de autenticación
- `galleryManager` - Operaciones de galería
- `componentManager` - Componentes UI
- Utilidades para compresión, validación, etc.

## 🔧 API Endpoints

### Autenticación
- `POST /auth/v1/token` - Login
- `POST /auth/v1/signup` - Registro
- `POST /auth/v1/logout` - Cerrar sesión

### Storage
- `POST /storage/v1/object/{bucket}` - Subir archivo
- `GET /storage/v1/object/public/{bucket}/{path}` - Obtener archivo

### Database
- `POST /rest/v1/{table}` - Insertar datos
- `GET /rest/v1/{table}` - Leer datos
- `PATCH /rest/v1/{table}` - Actualizar datos
- `DELETE /rest/v1/{table}` - Eliminar datos

## 🛠️ Desarrollo

### Variables de Entorno
Crea un archivo `.env` en la raíz:
```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon
```

### Scripts de Desarrollo
```bash
# Servidor de desarrollo
npm install -g serve
serve public -p 3000

# O con Python
python -m http.server 3000
```

### Estructura de Módulos
```javascript
// Importar módulos
import { authManager } from './auth.js';
import { galleryManager } from './gallery.js';
import { componentManager } from './components.js';
```

## 🚨 Solución de Problemas

### Error de CORS
Asegúrate de que los dominios estén configurados en Supabase:
- Settings → API → Site URL
- Settings → Authentication → URL Configuration

### Error de Políticas RLS
Verifica que las políticas en `schema.sql` estén correctamente aplicadas.

### Error de Storage
Los buckets deben tener visibilidad pública y políticas configuradas.

### Error de Autenticación
Revisa la configuración de email en Supabase Authentication settings.

## 📝 Próximos Pasos

Consulta `TODO.md` para ver las tareas pendientes y mejoras planeadas.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Si encuentras problemas:
1. Revisa la documentación de Supabase
2. Verifica la configuración de tu proyecto
3. Revisa la consola del navegador para errores
4. Abre un issue en el repositorio

---

**¡Disfruta compartiendo tus imágenes! 📸✨**
