# 📋 PLAN DE INTEGRACIÓN DE AUDIT LOGGING

## ✅ YA IMPLEMENTADO

1. **createCourseAction** - ✅ Logging agregado

---

## 🎯 ACCIONES QUE NECESITAN LOGGING

### **CURSOS (Course)**

```typescript
// updateCourseAction (línea ~49)
const { auditLogger } = await import("@/services/auditLogger");
await auditLogger.logCourseUpdate(
    courseId,
    title,
    session.user.id,
    session.user.name || "Usuario",
    { title, description, externalUrl }
);

// deleteCourseAction (línea ~86)
// Primero obtener el curso para tener el nombre
const course = await courseService.getCourseById(courseId);
const { auditLogger } = await import("@/services/auditLogger");
await auditLogger.logCourseDelete(
    courseId,
    course.title,
    session.user.id,
    session.user.name || "Usuario"
);
```

### **ACTIVIDADES (Activity)**

```typescript
// createActivityAction (línea ~105)
const activity = await activityService.createActivity({...});
const { auditLogger } = await import("@/services/auditLogger");
await auditLogger.logActivityCreate(
    activity.id,
    title,
    courseId,
    session.user.id,
    session.user.name || "Usuario"
);

// updateActivityAction (línea ~142)
const { auditLogger } = await import("@/services/auditLogger");
await auditLogger.log({
    action: "UPDATE",
    entity: "ACTIVITY",
    entityId: id,
    userId: session.user.id,
    userName: session.user.name || "Usuario",
    userRole: "teacher",
    description: `Actividad "${title}" actualizada`
});

// deleteActivityAction (línea ~177)
const { auditLogger } = await import("@/services/auditLogger");
await auditLogger.log({
    action: "DELETE",
    entity: "ACTIVITY",
    entityId: activityId,
    userId: session.user.id,
    userName: session.user.name || "Usuario",
    userRole: "teacher",
    description: `Actividad eliminada del curso`
});
```

### **INSCRIPCIONES (Enrollment)**

```typescript
// addStudentToCourseAction (línea ~195)
const { auditLogger } = await import("@/services/auditLogger");
const student = await prisma.user.findUnique({ where: { id: userId } });
const course = await courseService.getCourseById(courseId);
await auditLogger.logEnrollment(
    enrollmentId, // Necesitas capturar el ID del enrollment
    course.title,
    userId,
    student.name || "Estudiante"
);

// removeStudentFromCourseAction (línea ~221)
const { auditLogger } = await import("@/services/auditLogger");
const student = await prisma.user.findUnique({ where: { id: userId } });
const course = await courseService.getCourseById(courseId);
await auditLogger.logUnenrollment(
    course.title,
    userId,
    student.name || "Estudiante",
    session.user.id,
    session.user.name || "Profesor"
);

// enrollStudentAction (línea ~269)
const { auditLogger } = await import("@/services/auditLogger");
const course = await courseService.getCourseById(courseId);
await auditLogger.logEnrollment(
    enrollmentId, // Capturar del resultado
    course.title,
    session.user.id,
    session.user.name || "Estudiante"
);
```

### **ENTREGAS (Submission)**

```typescript
// submitActivityAction (línea ~279)
const submission = await activityService.submitActivity({...});
const { auditLogger } = await import("@/services/auditLogger");
const activity = await activityService.getActivityById(activityId);
await auditLogger.logSubmission(
    submission.id,
    activity.title,
    session.user.id,
    session.user.name || "Estudiante",
    submission.attemptCount
);

// deleteSubmissionAction (línea ~303)
const { auditLogger } = await import("@/services/auditLogger");
await auditLogger.log({
    action: "DELETE",
    entity: "SUBMISSION",
    entityId: submissionId,
    userId: session.user.id,
    userName: session.user.name || "Usuario",
    userRole: "teacher",
    description: `Entrega eliminada`
});
```

### **CALIFICACIONES (Grade)**

```typescript
// gradeManualActivityAction (línea ~404)
const { auditLogger } = await import("@/services/auditLogger");
const activity = await activityService.getActivityById(activityId);
const student = await prisma.user.findUnique({ where: { id: userId } });
await auditLogger.logGrade(
    existingSubmission?.id || "new",
    activity.title,
    student.name || "Estudiante",
    grade,
    session.user.id,
    session.user.name || "Profesor"
);

// finalizeSubmissionAction (línea ~376)
const { auditLogger } = await import("@/services/auditLogger");
const activity = await activityService.getActivityById(activityId);
await auditLogger.logGrade(
    submissionId,
    activity.title,
    session.user.name || "Estudiante",
    result.grade,
    "SYSTEM",
    "Gemini AI"
);
```

### **ASISTENCIA (Attendance)**

```typescript
// recordAttendanceAction (línea ~553)
const { auditLogger } = await import("@/services/auditLogger");
const student = await prisma.user.findUnique({ where: { id: userId } });
const course = await courseService.getCourseById(courseId);
await auditLogger.logAttendance(
    attendanceId, // Capturar del resultado
    course.title,
    student.name || "Estudiante",
    status,
    session.user.id,
    session.user.name || "Profesor"
);

// registerLateArrivalAction (línea ~612)
const { auditLogger } = await import("@/services/auditLogger");
const course = await courseService.getCourseById(courseId);
await auditLogger.logAttendance(
    result.id,
    course.title,
    session.user.name || "Estudiante",
    "LATE",
    session.user.id,
    session.user.name || "Estudiante"
);
```

### **OBSERVACIONES (Remark)**

```typescript
// createRemarkAction (línea ~642)
const { auditLogger } = await import("@/services/auditLogger");
const student = await prisma.user.findUnique({ where: { id: userId } });
const course = await courseService.getCourseById(courseId);
const remark = await remarkService.createRemark({...});
await auditLogger.logRemark(
    remark.id,
    type,
    student.name || "Estudiante",
    course.title,
    session.user.id,
    session.user.name || "Profesor"
);

// updateRemarkAction (línea ~684)
const { auditLogger } = await import("@/services/auditLogger");
await auditLogger.log({
    action: "UPDATE",
    entity: "REMARK",
    entityId: remarkId,
    userId: session.user.id,
    userName: session.user.name || "Usuario",
    userRole: "teacher",
    description: `Observación actualizada`
});

// deleteRemarkAction (línea ~706)
const { auditLogger } = await import("@/services/auditLogger");
await auditLogger.log({
    action: "DELETE",
    entity: "REMARK",
    entityId: remarkId,
    userId: session.user.id,
    userName: session.user.name || "Usuario",
    userRole: "teacher",
    description: `Observación eliminada`
});
```

### **NOTIFICACIONES (Notification)**

```typescript
// createNotificationAction (línea ~764)
const { auditLogger } = await import("@/services/auditLogger");
const notification = await notificationService.createNotification({...});
const recipientCount = studentIds.length || (await getRecipientCount(target, courseId));
await auditLogger.logNotification(
    notification.id,
    title,
    target,
    session.user.id,
    session.user.name || "Profesor",
    recipientCount
);

// updateNotificationAction (línea ~799)
const { auditLogger } = await import("@/services/auditLogger");
await auditLogger.log({
    action: "UPDATE",
    entity: "NOTIFICATION",
    entityId: notificationId,
    userId: session.user.id,
    userName: session.user.name || "Usuario",
    userRole: "teacher",
    description: `Notificación "${title}" actualizada`
});

// deleteNotificationAction
const { auditLogger } = await import("@/services/auditLogger");
await auditLogger.log({
    action: "DELETE",
    entity: "NOTIFICATION",
    entityId: notificationId,
    userId: session.user.id,
    userName: session.user.name || "Usuario",
    userRole: "teacher",
    description: `Notificación eliminada`
});
```

### **EXPORTACIONES**

```typescript
// En cualquier acción de exportación
const { auditLogger } = await import("@/services/auditLogger");
await auditLogger.logExport(
    "Calificaciones", // Tipo de entidad
    `${courseName}_Calificaciones.xlsx`,
    session.user.id,
    session.user.name || "Usuario",
    session.user.role || "student",
    exportData.length // Número de registros
);
```

---

## 🔐 LOGGING DE AUTENTICACIÓN

Estos deben agregarse en el archivo de autenticación (auth.ts o similar):

```typescript
// Al hacer login
const { auditLogger } = await import("@/services/auditLogger");
await auditLogger.logLogin(
    user.id,
    user.name,
    user.role,
    ipAddress,
    userAgent
);

// Al hacer logout
const { auditLogger } = await import("@/services/auditLogger");
await auditLogger.logLogout(
    session.user.id,
    session.user.name,
    session.user.role
);
```

---

## 📝 NOTAS IMPORTANTES

1. **Capturar IDs**: Algunas funciones de servicio necesitan retornar el ID del registro creado para poder loguearlo.

2. **Obtener nombres**: Para logs más descriptivos, a veces necesitas hacer queries adicionales para obtener nombres de usuarios/cursos.

3. **Try-Catch**: El logging NO debe romper la funcionalidad principal. El auditLogger ya tiene try-catch interno.

4. **Metadata**: Puedes agregar metadata adicional en formato JSON para contexto extra:
   ```typescript
   await auditLogger.log({
       ...
       metadata: { oldValue: "X", newValue: "Y", reason: "..." }
   });
   ```

5. **IP y UserAgent**: Para obtener estos datos:
   ```typescript
   const headersList = await headers();
   const ipAddress = headersList.get('x-forwarded-for') || 'unknown';
   const userAgent = headersList.get('user-agent') || 'unknown';
   ```

---

## 🎯 PRIORIDAD DE IMPLEMENTACIÓN

### **Alta Prioridad** (Implementar primero):
1. ✅ Crear curso
2. ⏳ Calificar actividad
3. ⏳ Entregar actividad
4. ⏳ Inscribir estudiante
5. ⏳ Eliminar curso
6. ⏳ Login/Logout

### **Media Prioridad**:
7. ⏳ Crear actividad
8. ⏳ Marcar asistencia
9. ⏳ Crear observación
10. ⏳ Enviar notificación

### **Baja Prioridad**:
11. ⏳ Actualizar curso
12. ⏳ Actualizar actividad
13. ⏳ Eliminar actividad
14. ⏳ Otras operaciones

---

## 🚀 SIGUIENTE PASO

Implementar logging en las acciones de **Alta Prioridad** primero para tener cobertura de las operaciones más críticas.

¿Quieres que implemente todas estas integraciones automáticamente?
