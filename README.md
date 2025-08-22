# Sistema de subida de imágenes con Supabase

Pasos rápidos:
1. Crea un proyecto en supabase.com.
2. Ve a SQL Editor y ejecuta `sql/schema.sql`.
3. En Storage crea un bucket público llamado `images`.
4. Copia `SUPABASE_URL` y `ANON KEY` a `public/supabaseClient.js`.
5. Sirve la carpeta `public` desde un servidor estático (live server, nginx, etc.).

Detalle UI:
- Usa el botón "Entrar / Registrar" en la esquina superior para abrir el modal de autenticación.
- Modal con pestañas para iniciar sesión o crear cuenta.
