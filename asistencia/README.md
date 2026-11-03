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

## 🚀 Instalación rápida

```bash
cd asistencia
npm install
npm run dev
```

1. Ejecuta `supabase/migrations/0001_init.sql` en el **SQL Editor** de tu proyecto en Supabase.
2. Configura `.env.local` basándote en `.env.example`.
3. Abre `http://localhost:3000/kiosco` (Kiosco) o `http://localhost:3000/admin` (Administración).
