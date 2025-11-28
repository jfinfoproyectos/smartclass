import { z } from "zod";

/**
 * Validation schemas for server actions
 * These schemas ensure data integrity and security by validating all inputs
 */

// ============ COURSE SCHEMAS ============

export const createCourseSchema = z.object({
    title: z.string()
        .min(3, "El título debe tener al menos 3 caracteres")
        .max(200, "El título no puede exceder 200 caracteres"),
    description: z.string()
        .max(5000, "La descripción no puede exceder 5000 caracteres")
        .optional(),
    externalUrl: z.string()
        .url("Debe ser una URL válida")
        .optional()
        .or(z.literal("")),
    startDate: z.string().datetime().optional().or(z.literal("")),
    endDate: z.string().datetime().optional().or(z.literal("")),
    schedules: z.string().optional(),
});

export const updateCourseSchema = createCourseSchema.extend({
    courseId: z.string().cuid("ID de curso inválido"),
});

export const deleteCourseSchema = z.object({
    courseId: z.string().cuid("ID de curso inválido"),
    confirmText: z.literal("ELIMINAR"),
});

// ============ ACTIVITY SCHEMAS ============

export const createActivitySchema = z.object({
    title: z.string()
        .min(3, "El título debe tener al menos 3 caracteres")
        .max(200, "El título no puede exceder 200 caracteres"),
    description: z.string()
        .max(10000, "La descripción no puede exceder 10000 caracteres")
        .optional(),
    statement: z.string()
        .max(10000, "El enunciado no puede exceder 10000 caracteres")
        .optional(),
    filePaths: z.string().optional(),
    deadline: z.string().datetime("Fecha límite inválida"),
    openDate: z.string().datetime("Fecha de apertura inválida").optional().or(z.literal("")),
    courseId: z.string().cuid("ID de curso inválido"),
    type: z.enum(["GITHUB", "MANUAL", "GOOGLE_COLAB"]),
    weight: z.number()
        .min(0, "El peso debe ser mayor o igual a 0")
        .max(100, "El peso no puede exceder 100")
        .default(1.0),
    maxAttempts: z.number()
        .int("Los intentos deben ser un número entero")
        .min(1, "Debe permitir al menos 1 intento")
        .max(10, "No se permiten más de 10 intentos")
        .default(1),
    allowLinkSubmission: z.boolean().default(false),
});

export const updateActivitySchema = createActivitySchema.partial().extend({
    activityId: z.string().cuid("ID de actividad inválido"),
    courseId: z.string().cuid("ID de curso inválido"),
});

export const deleteActivitySchema = z.object({
    activityId: z.string().cuid("ID de actividad inválido"),
    courseId: z.string().cuid("ID de curso inválido"),
    confirmText: z.literal("ELIMINAR"),
});

// ============ STUDENT MANAGEMENT SCHEMAS ============

export const addStudentSchema = z.object({
    userId: z.string().cuid("ID de usuario inválido"),
    courseId: z.string().cuid("ID de curso inválido"),
});

export const removeStudentSchema = addStudentSchema;

// ============ SUBMISSION SCHEMAS ============

export const submitActivitySchema = z.object({
    url: z.string()
        .url("Debe ser una URL válida")
        .max(500, "La URL no puede exceder 500 caracteres"),
    activityId: z.string().cuid("ID de actividad inválido"),
});

export const gradeManualActivitySchema = z.object({
    activityId: z.string().cuid("ID de actividad inválido"),
    userId: z.string().cuid("ID de usuario inválido"),
    courseId: z.string().cuid("ID de curso inválido"),
    grade: z.number()
        .min(0, "La nota debe ser mayor o igual a 0")
        .max(5, "La nota no puede exceder 5.0"),
    feedback: z.string()
        .max(5000, "La retroalimentación no puede exceder 5000 caracteres")
        .optional(),
});

// ============ PROFILE SCHEMAS ============

export const updateProfileSchema = z.object({
    identificacion: z.string()
        .min(5, "La identificación debe tener al menos 5 caracteres")
        .max(20, "La identificación no puede exceder 20 caracteres"),
    nombres: z.string()
        .min(2, "El nombre debe tener al menos 2 caracteres")
        .max(100, "El nombre no puede exceder 100 caracteres"),
    apellido: z.string()
        .min(2, "El apellido debe tener al menos 2 caracteres")
        .max(100, "El apellido no puede exceder 100 caracteres"),
    telefono: z.string()
        .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
            "Formato de teléfono inválido")
        .optional()
        .or(z.literal("")),
    geminiApiKey: z.string()
        .min(20, "La API key debe tener al menos 20 caracteres")
        .optional()
        .or(z.literal("")),
});

// ============ ATTENDANCE SCHEMAS ============

export const recordAttendanceSchema = z.object({
    courseId: z.string().cuid("ID de curso inválido"),
    userId: z.string().cuid("ID de usuario inválido"),
    date: z.date(),
    status: z.enum(["PRESENT", "ABSENT", "EXCUSED"]),
});

// ============ REMARK SCHEMAS ============

export const createRemarkSchema = z.object({
    type: z.enum(["ATTENTION", "COMMENDATION"]),
    title: z.string()
        .min(3, "El título debe tener al menos 3 caracteres")
        .max(200, "El título no puede exceder 200 caracteres"),
    description: z.string()
        .min(10, "La descripción debe tener al menos 10 caracteres")
        .max(2000, "La descripción no puede exceder 2000 caracteres"),
    courseId: z.string().cuid("ID de curso inválido"),
    userId: z.string().cuid("ID de usuario inválido"),
    date: z.string().datetime("Fecha inválida").optional(),
});

// ============ ADMIN SCHEMAS ============

export const createUserSchema = z.object({
    email: z.string()
        .email("Correo electrónico inválido")
        .max(255, "El correo no puede exceder 255 caracteres"),
    name: z.string()
        .min(2, "El nombre debe tener al menos 2 caracteres")
        .max(100, "El nombre no puede exceder 100 caracteres"),
    role: z.enum(["teacher", "admin"]),
    password: z.string()
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .max(100, "La contraseña no puede exceder 100 caracteres")
        .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
        .regex(/[a-z]/, "La contraseña debe contener al menos una minúscula")
        .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
});

export const updateSystemSettingsSchema = z.object({
    geminiApiKeyMode: z.enum(["GLOBAL", "USER"]),
    globalApiKey: z.string()
        .min(20, "La API key debe tener al menos 20 caracteres")
        .optional()
        .or(z.literal("")),
});

// ============ HELPER FUNCTIONS ============

/**
 * Validates FormData against a Zod schema
 * Throws an error with detailed validation messages if validation fails
 */
export function validateFormData<T>(
    formData: FormData,
    schema: z.ZodSchema<T>
): T {
    const data: Record<string, any> = {};

    formData.forEach((value, key) => {
        // Handle special cases
        if (key === "weight" || key === "maxAttempts" || key === "grade") {
            data[key] = parseFloat(value as string);
        } else if (key === "allowLinkSubmission") {
            data[key] = value === "true";
        } else {
            data[key] = value;
        }
    });

    try {
        return schema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const messages = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(", ");
            throw new Error(`Validación fallida: ${messages}`);
        }
        throw error;
    }
}

/**
 * Validates a plain object against a Zod schema
 */
export function validateData<T>(
    data: unknown,
    schema: z.ZodSchema<T>
): T {
    try {
        return schema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const messages = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(", ");
            throw new Error(`Validación fallida: ${messages}`);
        }
        throw error;
    }
}
