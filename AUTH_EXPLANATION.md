# Sistema de Autenticación Supabase

## Tablas de Usuarios y Contraseñas

**Las tablas de usuarios y contraseñas NO se crean manualmente** - son proporcionadas automáticamente por Supabase.

### Tablas Automáticas de Supabase Auth:

1. **`auth.users`** - Tabla principal de usuarios
   - `id` (UUID) - Identificador único del usuario
   - `email` - Email del usuario
   - `encrypted_password` - Contraseña encriptada (hash)
   - `email_confirmed_at` - Fecha de confirmación de email
   - `created_at`, `updated_at` - Timestamps
   - Y muchos más campos...

2. **`auth.identities`** - Para autenticación social (Google, GitHub, etc.)
3. **`auth.sessions`** - Sesiones de usuarios
4. **`auth.refresh_tokens`** - Tokens de refresco

### Cómo Funciona la Autenticación:

1. **Registro**: Cuando un usuario se registra, Supabase crea automáticamente un registro en `auth.users`
2. **Login**: Supabase verifica las credenciales contra `auth.users`
3. **Sesión**: Crea una sesión segura con JWT tokens
4. **Referencias**: Tu aplicación referencia `auth.users.id` en tus tablas personalizadas

### En Nuestro Sistema:

Las tablas que creamos (`images`, `ratings`, `comments`, `favorites`) tienen:
```sql
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
```

Esto crea una relación foreign key con la tabla de usuarios de Supabase.

### Ventajas de este Enfoque:

1. **Seguridad**: Supabase maneja el hashing de contraseñas
2. **Escalabilidad**: Sistema probado y optimizado
3. **Múltiples métodos**: Soporta email, social logins, magic links
4. **RLS integrado**: Políticas de seguridad automáticas
5. **Cero mantenimiento**: No necesitas gestionar tablas de auth

### Configuración Requerida:

1. En el dashboard de Supabase, ve a **Authentication → Settings**
2. Configura:
   - Site URL (ej: http://localhost:3000)
   - Redirect URLs
   - Email templates
   - Proveedores OAuth (opcional)

### Flujo de Autenticación:

1. Usuario hace signup/signin → Supabase crea/verifica usuario
2. Supabase devuelve JWT token → Tu app lo almacena
3. En requests a la API: Header `Authorization: Bearer <JWT>`
4. RLS policies verifican automáticamente el usuario

**No necesitas crear tablas de usuarios manualmente** - Supabase lo hace todo automáticamente con seguridad enterprise-grade.
