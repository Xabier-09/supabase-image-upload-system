# Estructura del Proyecto - Galería de Imágenes Supabase

## 📁 Estructura de Archivos

```
supabase-image-upload-system/
├── index.html              # Archivo principal HTML
├── css/
│   └── styles.css          # Estilos principales (responsive + dark mode)
├── js/
│   ├── supabase.js         # Configuración y servicios de Supabase
│   ├── auth.js             # Manejo de autenticación
│   ├── gallery.js          # Funcionalidad de galería y subida
│   ├── comments.js         # Sistema de comentarios
│   ├── favorites.js        # Sistema de favoritos
│   ├── rating.js           # Sistema de valoraciones
│   ├── search.js           # Búsqueda y filtrado
│   └── app.js              # Aplicación principal (coordinación)
├── config.example.js       # Plantilla de configuración
├── setup-supabase.sql      # Script SQL para configurar Supabase
├── README.md               # Documentación principal
├── .gitignore             # Archivos ignorados por Git
└── PROJECT_STRUCTURE.md    # Este archivo
```

## 🚀 Configuración Rápida

### 1. Configurar Supabase
1. Crear cuenta en [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Ejecutar el script `setup-supabase.sql` en el editor SQL
4. Obtener URL y clave anónima del proyecto

### 2. Configurar la Aplicación
1. Copiar `config.example.js` a `config.js`
2. Actualizar con tus credenciales de Supabase:
```javascript
const SUPABASE_CONFIG = {
    URL: 'https://tu-proyecto.supabase.co',
    ANON_KEY: 'tu-clave-anon-aqui'
};
```

### 3. Ejecutar la Aplicación
Abrir `index.html` en un navegador web o usar un servidor local:
```bash
# Con Python
python -m http.server 8000

# Con Node.js
npx serve
```

## 🔧 Características Implementadas

### ✅ Autenticación Completa
- Registro con email/contraseña
- Login seguro
- Gestión de sesiones
- Protección de rutas

### ✅ Subida de Imágenes
- Drag & drop
- Compresión automática
- Validación de tipos y tamaños
- Previsualización

### ✅ Sistema de Valoraciones
- Calificaciones de 1-5 estrellas
- Promedios automáticos
- Restricción una valoración por usuario

### ✅ Sistema de Comentarios
- Comentarios en tiempo real
- Edición y eliminación
- Moderación por propietario

### ✅ Favoritos
- Guardar/eliminar favoritos
- Lista personalizada
- Sincronización automática

### ✅ Búsqueda y Filtrado
- Búsqueda por texto
- Filtrado por categorías
- Ordenamiento múltiple
- URLs compartibles

### ✅ UI/UX Moderna
- Diseño responsive
- Modo oscuro/claro
- Animaciones suaves
- Accesibilidad

### ✅ Seguridad
- Políticas RLS en Supabase
- Validación de entrada
- Protección contra XSS
- Sanitización de datos

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Iconos**: Font Awesome 6
- **Estilos**: CSS Grid, Flexbox, Variables CSS

## 📱 Responsive Design

La aplicación está optimizada para:
- 📱 Móviles (320px+)
- 📟 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Pantallas grandes (1200px+)

## 🎨 Temas

- **Modo Claro**: Colores claros, alto contraste
- **Modo Oscuro**: Colores oscuros, descanso visual
- **Sistema**: Detección automática de preferencias del sistema

## 🔒 Seguridad

### Políticas RLS Implementadas:
- Solo usuarios autenticados pueden subir imágenes
- Cada usuario solo modifica sus propios contenidos
- Las imágenes son públicas para visualización
- Los comentarios y valoraciones son públicos

### Validaciones:
- Tamaño máximo de archivo: 5MB
- Tipos permitidos: JPEG, PNG, GIF, WebP
- Sanitización de entradas de usuario
- Protección contra inyecciones SQL

## 📊 Base de Datos

### Tablas Principales:
1. **images**: Metadatos de imágenes
2. **ratings**: Valoraciones de usuarios
3. **comments**: Comentarios de usuarios
4. **favorites**: Imágenes favoritas

### Relaciones:
- images.user_id → auth.users.id
- ratings.user_id → auth.users.id
- ratings.image_id → images.id
- comments.user_id → auth.users.id
- comments.image_id → images.id
- favorites.user_id → auth.users.id
- favorites.image_id → images.id

## 🚀 Rendimiento

### Optimizaciones:
- **Lazy loading** de imágenes
- **Paginación** de resultados
- **Compresión** de imágenes
- **Caché** de recursos
- **Debouncing** en búsquedas

### Métricas Objetivo:
- ✅ Tiempo de carga inicial < 3s
- ✅ Interacción en < 100ms
- ✅ Puntuación Lighthouse > 90

## 🧪 Testing

### Funcionalidades Probadas:
- [x] Flujo de autenticación
- [x] Subida de imágenes
- [x] Sistema de valoraciones
- [x] Comentarios
- [x] Favoritos
- [x] Búsqueda y filtrado
- [x] Responsive design
- [x] Modo oscuro

## 📈 Escalabilidad

### Preparado para:
- ✅ Miles de imágenes
- ✅ Cientos de usuarios concurrentes
- ✅ Alta disponibilidad
- ✅ Backup automático (Supabase)

## 🤝 Contribución

### Para contribuir:
1. Fork del proyecto
2. Crear feature branch
3. Commit de cambios
4. Push al branch
5. Crear Pull Request

### Guía de estilos:
- **HTML**: Semantic HTML5
- **CSS**: BEM methodology
- **JS**: ES6+ modules
- **Commits**: Conventional commits

## 📝 Licencia

MIT License - ver archivo LICENSE para detalles.

## 🆘 Soporte

### Problemas comunes:
1. **Error de configuración**: Verificar credenciales de Supabase
2. **Imágenes no se cargan**: Verificar políticas RLS
3. **Autenticación falla**: Verificar configuración de Auth en Supabase

### Recursos:
- [Documentación Supabase](https://supabase.com/docs)
- [Issues del proyecto](https://github.com/tu-usuario/galeria-imagenes/issues)
- [Comunidad Discord](https://discord.supabase.com)

---

**¿Necesitas ayuda?** Abre un issue en GitHub o contacta al maintainer.

*Última actualización: ${new Date().toLocaleDateString()}*
