# 🕒 Sistema de Control de Asistencia por Cédula, PIN o Código QR

Sistema web completo de **Control de Asistencia** construido con **Next.js (App Router)**, **Supabase (PostgreSQL, Auth, Storage)** y **Tailwind CSS**.

Permite registrar la **entrada** y **salida** de personas desde un panel tipo **Kiosco** o desde el **celular**, guardando la hora exacta del servidor, validando horarios laborales y mostrando en vivo la **lista de presentes del día**.

---

## ✨ Características principales

- **🔢 Triple método de marcación:**
  - **Cédula / Documento** con teclado numérico en pantalla o lector físico.
  - **PIN de 4 dígitos** para marcación rápida.
  - **Código QR dinámico y por carnet:** muestra un QR en la pantalla del kiosco para escanear desde el celular (`/marcar`) o permite abrir la cámara en dispositivos móviles para escanear el carnet QR de la persona.
- **📸 Confirmación visual con foto y sonido:**
  - 🟢 **Verde (`¡Llegaste a tiempo!`):** cuando la persona marca entrada dentro de su horario + minutos de tolerancia.
  - 🔴 **Rojo (`Llegaste tarde`):** muestra la foto y los minutos exactos de retraso.
  - 🔵 **Azul (`Hasta luego`):** al registrar la salida una vez cumplido su horario laboral.
- **🔒 Control de horario laboral:**
  - No permite marcar **salida** si la persona no ha registrado su **entrada** del día o si aún no ha terminado su horario laboral (`hora_salida`).
- **📋 Lista de presentes en tiempo real:**
  - Muestra en el Kiosco y en el Dashboard quiénes están presentes hoy, su foto, área, hora de entrada y estado de puntualidad (`A tiempo` / `Tarde`).
- **⚙️ Panel de Administración (`/admin`):**
  - **Resumen del día:** contadores de presentes ahora, llegadas a tiempo, llegadas tarde y ausentes.
  - **Gestión de Personas:** CRUD completo, subida o captura de foto desde cámara (con compresión automática), asignación de horario, generación e impresión de **carnet con código QR**.
  - **Gestión de Horarios:** creación de turnos con hora de entrada, hora de salida y minutos de tolerancia (también disponible como creación rápida desde el formulario de personas).
  - **Historial y Reportes:** filtro por rango de fechas, persona y tipo (`Entradas`, `Salidas`, `Llegadas tarde`) + **exportación a CSV (Excel)**.

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|---|---|
| **Frontend & Backend** | Next.js 16 (App Router, Server Actions, TypeScript) |
| **Estilos** | Tailwind CSS v4 |
| **Base de Datos & Auth** | Supabase (PostgreSQL, Row Level Security, Auth, Storage) |
| **Códigos QR** | `qrcode` (generación) + `@yudiel/react-qr-scanner` (lectura por cámara) |
| **Validación** | `zod` |

---

## 📂 Estructura del proyecto

```text
asistencia/
├── app/
│   ├── kiosco/                 # Panel principal del Kiosco (teclado, QR y presentes)
│   ├── marcar/                 # Vista móvil al escanear el QR del Kiosco
│   ├── login/                  # Inicio de sesión de administradores
│   └── admin/                  # Panel administrativo protegido
│       ├── page.tsx            # Resumen de asistencia de hoy
│       ├── personas/           # CRUD de personas, fotos y carnet QR
│       ├── horarios/           # Configuración de turnos y tolerancia
│       └── marcaciones/        # Historial filtrable y exportación CSV
├── components/
│   ├── Avatar.tsx              # Foto o iniciales de la persona
│   └── kiosco/                 # Reloj, TecladoNumerico, QRKiosco, Confirmacion, ListaPresentes
├── lib/
│   ├── supabase/               # Clientes Supabase (browser, server, admin)
│   ├── fechas.ts               # Formato de fecha/hora (America/Bogota)
│   ├── qr-token.ts             # Tokens firmados para el QR dinámico del kiosco
│   └── tipos.ts                # Tipos TypeScript compartidos
└── supabase/
    └── migrations/
        └── 0001_init.sql       # Esquema completo de base de datos, vistas, RLS y Storage
```

---

## 🚀 Instalación y puesta en marcha

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone https://github.com/CristianGa27/-Sistema_de_control_de_asistencia_por_c-digo_PIN_o_QR.git
cd -Sistema_de_control_de_asistencia_por_c-digo_PIN_o_QR/asistencia
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Abre **SQL Editor**, copia todo el contenido de `asistencia/supabase/migrations/0001_init.sql` y ejecútalo (**Run**).
3. En **Authentication → Users**, crea tu usuario administrador (marca *Auto Confirm User*) y vuelve a ejecutar el bloque final del SQL para asignarle rol en `perfiles_admin`.

### 3. Variables de entorno

Copia `asistencia/.env.example` a `asistencia/.env.local` y completa tus claves de Supabase (**Project Settings → API**):

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-publishable-o-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-secret-o-service-role-key
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

*(En Windows también puedes ejecutar directamente `iniciar.bat`).*

- **Kiosco de Asistencia:** [http://localhost:3000/kiosco](http://localhost:3000/kiosco)
- **Panel de Administración:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 👤 Autor

Desarrollado por **Cristian García** ([@CristianGa27](https://github.com/CristianGa27)).
