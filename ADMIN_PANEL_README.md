# Panel de Administrador - SmartClass

## 📋 Descripción General

El Panel de Administrador es un sistema completo e independiente para la gestión y monitoreo del sistema SmartClass. Proporciona herramientas avanzadas para administrar usuarios, cursos, actividades y monitorear la salud del sistema.

## 🎯 Características Implementadas

### ✅ Fase 1 - Funcionalidades Esenciales

#### 1. **Dashboard Principal** (`/dashboard/admin`)
- **Métricas en tiempo real:**
  - Total de usuarios (profesores/estudiantes)
  - Cursos activos vs archivados
  - Actividades por tipo (GitHub, Manual, Google Colab)
  - Entregas totales y pendientes
  - Notificaciones y observaciones
  
- **Tendencias del sistema:**
  - Actividad semanal y mensual
  - Nuevos registros
  - Tasas de uso

- **Estadísticas calculadas:**
  - Tasa de entregas
  - Promedio de estudiantes por curso
  - Actividades recientes

#### 2. **Gestión de Usuarios** (`/dashboard/admin/users`)
- **Búsqueda y filtrado:**
  - Por nombre o email
  - Por rol (admin/teacher/student)
  
- **Acciones disponibles:**
  - Cambiar rol de usuario
  - Ver detalles completos del usuario
  - Eliminar usuarios
  - Ver estadísticas por usuario (cursos, entregas, etc.)

- **Información detallada:**
  - Datos personales del perfil
  - Fecha de registro
  - Actividad en el sistema

#### 3. **Gestión de Cursos** (`/dashboard/admin/courses`)
- **Vista general:**
  - Todos los cursos del sistema
  - Estado (activo/archivado)
  - Número de estudiantes y actividades
  
- **Filtros:**
  - Por estado (activos/archivados)
  - Búsqueda por título o profesor
  
- **Acciones:**
  - Reasignar profesor a un curso
  - Ver detalles del curso
  - Acceso directo al curso

#### 4. **Gestión de Actividades** (`/dashboard/admin/activities`)
- **Vista completa:**
  - Todas las actividades del sistema
  - Tipo de actividad (GitHub, Manual, Google Colab)
  - Curso y profesor asociado
  
- **Estadísticas:**
  - Distribución por tipo
  - Número de entregas por actividad
  
- **Filtros:**
  - Por tipo de actividad
  - Búsqueda por título o curso

#### 5. **Estadísticas Avanzadas** (`/dashboard/admin/statistics`)
- **Métricas clave:**
  - Tasa de entregas global
  - Distribución de usuarios por rol
  - Distribución de actividades por tipo
  
- **Visualizaciones:**
  - Gráficos de barras de progreso
  - Porcentajes y comparativas
  
- **Análisis:**
  - Estado de entregas
  - Comunicaciones (notificaciones/observaciones)
  - Actividad reciente

#### 6. **Monitoreo del Sistema** (`/dashboard/admin/system`)
- **Estado de salud:**
  - Conexión a base de datos
  - Contadores de registros
  
- **Actividad reciente:**
  - Últimas entregas realizadas
  - Acciones de usuarios
  
- **Información del sistema:**
  - Versión
  - Entorno (producción/desarrollo)
  - Servicios externos activos

### 🔄 Funcionalidades Pendientes (Fase 2 y 3)

#### Notificaciones (`/dashboard/admin/notifications`)
- Vista de todas las notificaciones
- Envío masivo de notificaciones
- Estadísticas de lectura
- **Estado:** Página placeholder creada

#### Configuración (`/dashboard/admin/settings`)
- Configuración de Gemini AI
- Configuración de GitHub
- Configuración de Google Colab
- Temas y personalización
- **Estado:** Página placeholder creada

## 🏗️ Arquitectura

### Integración con Navegación Principal

El panel de administrador está **completamente integrado** en la navegación principal de la aplicación (`app-sidebar.tsx`). No hay sidebars duplicados ni layouts separados. Todos los roles (admin, teacher, student) comparten la misma barra de navegación lateral.

### Estructura de Archivos

```
src/
├── app/
│   ├── admin-actions.ts              # Server actions exclusivas para admin
│   └── dashboard/admin/
│       ├── page.tsx                  # Dashboard principal
│       ├── users/page.tsx            # Gestión de usuarios
│       ├── courses/page.tsx          # Gestión de cursos
│       ├── activities/page.tsx       # Gestión de actividades
│       ├── statistics/page.tsx       # Estadísticas
│       ├── system/page.tsx           # Monitoreo del sistema
│       ├── notifications/page.tsx    # Notificaciones (placeholder)
│       └── settings/page.tsx         # Configuración (placeholder)
│
├── components/sidebar/
│   └── app-sidebar.tsx               # Navegación unificada (admin/teacher/student)
│
├── features/admin/
│   ├── AdminDashboard.tsx            # Dashboard principal
│   ├── UserManagement.tsx            # Gestión de usuarios
│   ├── CourseManagement.tsx          # Gestión de cursos
│   ├── ActivityManagement.tsx        # Gestión de actividades
│   ├── AdminStatistics.tsx           # Estadísticas
│   └── SystemMonitor.tsx             # Monitoreo del sistema
│
└── services/
    └── adminService.ts               # Lógica de negocio para admin
```

### Servicios Implementados

#### `adminService.ts`
- `getDashboardMetrics()` - Métricas del dashboard
- `getAllUsers()` - Lista de usuarios con filtros
- `getUserDetails()` - Detalles de un usuario
- `updateUserRole()` - Cambiar rol de usuario
- `deleteUser()` - Eliminar usuario
- `getAllCoursesAdmin()` - Lista de cursos con filtros
- `getCourseDetailsAdmin()` - Detalles de un curso
- `reassignCourseTeacher()` - Reasignar profesor
- `getAllActivitiesAdmin()` - Lista de actividades
- `getAllNotificationsAdmin()` - Lista de notificaciones
- `getSystemStats()` - Estadísticas por período
- `getRecentActivity()` - Actividad reciente

#### `admin-actions.ts`
Todas las server actions tienen middleware de autenticación que verifica:
- Usuario autenticado
- Rol de administrador

## 🔒 Seguridad

### Control de Acceso
- **Middleware `requireAdmin()`:** Verifica que el usuario tenga rol "admin"
- **Redirección automática:** Los no-admin son redirigidos a `/dashboard/student`
- **Validación en cada acción:** Todas las server actions verifican permisos

### Aislamiento
- **Rutas independientes:** `/dashboard/admin/*`
- **Layout propio:** No interfiere con teacher/student
- **Servicios separados:** `adminService.ts` y `admin-actions.ts`

## 📊 Métricas y Estadísticas

### Métricas Calculadas
1. **Tasa de entregas:** `(total entregas / total actividades) * 100`
2. **Promedio estudiantes/curso:** `total estudiantes / total cursos`
3. **Promedio actividades/curso:** `total actividades / total cursos`
4. **Distribución por tipo:** Porcentaje de cada tipo de actividad

### Períodos de Análisis
- **Última semana:** 7 días
- **Último mes:** 30 días
- **Último año:** 365 días

## 🎨 Interfaz de Usuario

### Componentes Principales
- **Cards:** Métricas y estadísticas
- **Tables:** Listas de usuarios, cursos, actividades
- **Badges:** Estados y categorías
- **Dialogs/Sheets:** Detalles y acciones
- **Select:** Filtros y cambio de roles

### Tema
- Compatible con modo claro/oscuro
- Usa el sistema de diseño de shadcn/ui
- Iconos de Lucide React

## 🚀 Uso

### Acceso
1. Iniciar sesión con una cuenta de rol "admin"
2. Navegar a `/dashboard/admin`
3. Usar la barra lateral para acceder a las diferentes secciones

### Operaciones Comunes

#### Cambiar rol de un usuario
1. Ir a "Usuarios"
2. Buscar el usuario
3. Usar el selector de rol en la tabla
4. Confirmar el cambio

#### Reasignar un curso
1. Ir a "Cursos"
2. Buscar el curso
3. Click en "Reasignar"
4. Seleccionar nuevo profesor
5. Confirmar

#### Ver estadísticas
1. Ir a "Estadísticas"
2. Ver métricas generales
3. Analizar distribuciones
4. Revisar tendencias

## 🔧 Mantenimiento

### Limpieza de Datos
- `cleanupOldNotificationsAction()` - Elimina notificaciones antiguas leídas

### Salud del Sistema
- `getSystemHealthAction()` - Verifica conexión a BD y estado general

## 📝 Notas de Desarrollo

### Independencia Total
- ✅ No modifica código existente de teacher/student
- ✅ Rutas completamente separadas
- ✅ Servicios y acciones propias
- ✅ Layout independiente

### Extensibilidad
El sistema está diseñado para ser fácilmente extensible:
- Agregar nuevas métricas en `adminService.ts`
- Crear nuevas páginas en `/dashboard/admin/`
- Añadir componentes en `/features/admin/`

### Próximas Mejoras
1. Implementar gestión completa de notificaciones
2. Panel de configuración del sistema
3. Exportación de reportes (PDF/Excel)
4. Gráficos avanzados (charts.js o recharts)
5. Logs de auditoría detallados
6. Backups automáticos

## 🐛 Debugging

### Logs
Todas las acciones importantes generan logs en consola:
```typescript
console.log("[AdminService] Action performed:", data);
```

### Errores Comunes
1. **"Unauthorized":** Usuario no tiene rol admin
2. **"Not found":** Recurso no existe en BD
3. **Database connection error:** Problema con Prisma

## 📚 Referencias

- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [shadcn/ui](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)

---

**Versión:** 1.0.0  
**Última actualización:** 2025-11-25  
**Desarrollado por:** Antigravity AI
