# Control de Asistencia (Cédula / PIN / QR)

Next.js + Supabase. Kiosco para marcar entrada y salida con cédula, PIN de 4 dígitos o código QR.
Muestra la foto de la persona con un mensaje **verde (a tiempo)**, **rojo (tarde)** o **azul (salida)**,
y la lista de presentes del día.

## Puesta en marcha

### 1. Supabase
1. Crea un proyecto en https://supabase.com.
2. Ve a **SQL Editor**, pega todo el contenido de `supabase/migrations/0001_init.sql` y ejecútalo.
3. Crea tu usuario administrador: **Authentication → Users → Add user** (correo + contraseña, marca *Auto Confirm*).
4. Dale permisos de admin ejecutando en el SQL Editor (cambia el correo):
   ```sql
   insert into perfiles_admin (id, nombre)
   select id, 'Administrador' from auth.users where email = 'tu-correo@ejemplo.com';
   ```

### 2. Variables de entorno
Copia `.env.example` a `.env.local` y llena los valores de **Project Settings → API**.

### 3. Ejecutar
```bash
npm install
npm run dev
```
- Kiosco: http://localhost:3000/kiosco
- Administración: http://localhost:3000/admin

## Uso
1. En **Admin → Horarios** ajusta la hora de entrada y la tolerancia.
2. En **Admin → Personas** registra a cada persona con su foto, cédula, PIN (opcional) y horario.
3. Desde la ficha de la persona descarga o imprime su carnet con QR.
4. Abre `/kiosco` en el equipo de la entrada (F11 para pantalla completa).

## Reglas
- La primera marcación del día es **entrada**, la siguiente **salida**, y así sucesivamente.
- La hora la pone el servidor de base de datos (no se puede manipular desde el equipo).
- No se permite marcar dos veces en menos de 60 segundos.
- Entrada después de *hora de entrada + tolerancia* = **tarde**.
- La cámara para escanear QR requiere `localhost` o HTTPS.
- Los lectores QR USB funcionan en la pestaña "Cédula / PIN" (escriben el código y presionan Enter).
