<<<<<<< HEAD
# Galería de Imágenes con Supabase

Este proyecto es un sistema completo de galería de imágenes construido con Supabase. Permite a los usuarios subir, gestionar y compartir imágenes, así como interactuar con ellas a través de un sistema de valoraciones, comentarios y favoritos.

## Características

- **Autenticación completa**: Registro y login con email/contraseña.
- **Subida de imágenes**: Compresión automática y validación.
- **Sistema de valoraciones**: Calificaciones de 1-5 estrellas con comentarios.
- **Comentarios**: Sistema de comentarios para cada imagen.
- **Favoritos**: Guarda tus imágenes favoritas.
- **Búsqueda y filtrado**: Encuentra imágenes fácilmente.
- **Diseño responsive**: Funciona en desktop y móvil.
- **UI moderna**: Interfaz elegante con modo oscuro.
- **Seguridad**: Políticas RLS y validación robusta.

## Requisitos

- Node.js
- Supabase

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu_usuario/galeria-imagenes-supabase.git
   cd galeria-imagenes-supabase
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura Supabase:
   - Crea un proyecto en [Supabase](https://supabase.io/).
   - Configura las tablas necesarias (`images`, `ratings`, `comments`, `favorites`).
   - Obtén la URL y la clave anónima de tu proyecto y actualiza el archivo `js/supabase.js`.

4. Abre el archivo `index.html` en tu navegador.

## Uso

- Regístrate o inicia sesión para acceder a todas las funciones.
- Sube imágenes y añade títulos y descripciones.
- Califica y comenta las imágenes.
- Guarda tus imágenes favoritas y busca a través de la galería.

## Contribuciones

Las contribuciones son bienvenidas. Si deseas contribuir, por favor abre un issue o envía un pull request.

## Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo LICENSE para más detalles.
=======
Nova Gallery - Supabase Image Platform (Reinvented)

Setup:
1. Create Supabase project.
2. In Storage create bucket named 'images' (public if you want direct URLs).
3. Run sql/setup.sql in Supabase SQL editor.
4. Edit js/supabase.js and replace SUPABASE_URL and SUPABASE_ANON_KEY.
5. Serve index.html with a static server.

Files:
- index.html
- css/styles.css
- js/supabase.js
- js/utils.js
- js/app.js
- sql/setup.sql
>>>>>>> d5cd62e (Actualizado)
