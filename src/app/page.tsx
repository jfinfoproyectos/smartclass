import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GraduationCap, BookOpen, Settings2 } from "lucide-react"
import { ModeToggle } from "@/components/theme/ModeToggle"
import { HeroSection } from "@/features/landing/HeroSection"

export default function Page() {
  return (
    <main className="bg-background text-foreground">
      <HeroSection />

      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Todo lo que necesitas</h2>
            <p className="text-muted-foreground mt-4">Herramientas diseñadas para potenciar la enseñanza y el aprendizaje</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2"><Settings2 className="size-5 text-primary" /><CardTitle className="text-lg">Administración</CardTitle></div>
                <CardDescription>Gestión total de la institución</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-3">
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" />Gestión de usuarios y roles</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" />Control de cursos y períodos</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" />Auditoría del sistema</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-300 border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2"><BookOpen className="size-5 text-primary" /><CardTitle className="text-lg">Docentes</CardTitle></div>
                <CardDescription>Herramientas potentes de evaluación</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-3">
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" />Creación de actividades GitHub/Manual</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" />Asistente de calificación con IA</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" />Gestión de notificaciones</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2"><GraduationCap className="size-5 text-primary" /><CardTitle className="text-lg">Estudiantes</CardTitle></div>
                <CardDescription>Seguimiento claro del progreso</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-3">
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" />Entrega de actividades y enlaces</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" />Visualización de feedback detallado</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" />Historial de calificaciones</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="grid grid-cols-2 gap-4">
              <Card className="col-span-2 bg-primary text-primary-foreground border-none">
                <CardHeader>
                  <CardTitle className="text-4xl font-bold">100%</CardTitle>
                  <CardDescription className="text-primary-foreground/80">Digital y sin papeles</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-primary">IA</CardTitle>
                  <CardDescription>Integrada</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-primary">24/7</CardTitle>
                  <CardDescription>Disponibilidad</CardDescription>
                </CardHeader>
              </Card>
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Empieza hoy mismo</h2>
              <p className="text-muted-foreground mt-4 text-lg">
                Únete a la revolución educativa con SmartClass. Una plataforma diseñada para simplificar la gestión académica y potenciar el aprendizaje.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/signup">Crear cuenta gratis</Link>
                </Button>
                <Button variant="ghost" size="lg" asChild>
                  <Link href="/signin">Ya tengo cuenta</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-muted/10">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded bg-primary/20 flex items-center justify-center">
                <div className="size-3 rounded-full bg-primary" />
              </div>
              <span className="font-bold text-lg">SmartClass</span>
            </div>
            <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} SmartClass. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Términos</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacidad</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contacto</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
