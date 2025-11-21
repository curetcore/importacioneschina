# 🤖 Plan de Implementación: Monitoreo de Automatizaciones n8n

## 🎯 Objetivo

Crear un módulo completo de monitoreo para las automatizaciones de n8n dentro de CuretCore, permitiendo:

- Visualizar workflows activos/inactivos
- Monitorear ejecuciones en tiempo real
- Recibir alertas de errores
- Ver métricas de performance
- Activar/desactivar workflows desde la UI
- Re-ejecutar workflows fallidos

---

## 📊 Nivel de Complejidad

**FÁCIL-MEDIO** - Ya tienes el 90% de la infraestructura necesaria

**Tiempo Estimado Total:** 3-5 días de desarrollo

**Ventajas Existentes:**

- ✅ Dashboard con KPIs y gráficos (Recharts)
- ✅ Sistema de API Routes con Next.js
- ✅ Autenticación y roles
- ✅ Tablas avanzadas (TanStack Table)
- ✅ Notificaciones en tiempo real (Pusher)
- ✅ UI Components listos (Radix UI + Tailwind)

---

## 📋 Requisitos Previos

### n8n Setup

- [ ] n8n instalado y corriendo (self-hosted o cloud)
- [ ] API habilitada en n8n (Settings → API)
- [ ] API Key generada
- [ ] (Opcional) Webhooks configurados para eventos real-time

### Variables de Entorno

```bash
# Agregar a .env.local y .env.production
N8N_URL="https://tu-n8n-instance.com"
N8N_API_KEY="tu_api_key_aqui"
N8N_WEBHOOK_SECRET="secreto_para_validar_webhooks" # Opcional
```

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    FLUJO DE DATOS                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  n8n Instance                                            │
│  ├─ Workflows activos/inactivos                         │
│  ├─ Historial de ejecuciones                            │
│  └─ 📡 REST API                                          │
│         ↓                                                │
│  CuretCore Backend (Next.js API Routes)                 │
│  ├─ /api/n8n/workflows → Lista workflows               │
│  ├─ /api/n8n/executions → Historial ejecuciones        │
│  ├─ /api/n8n/webhook → Recibe eventos real-time        │
│  └─ Cache con Redis (opcional)                          │
│         ↓                                                │
│  CuretCore Frontend (React + TanStack Query)            │
│  ├─ /automatizaciones → Dashboard principal            │
│  ├─ /automatizaciones/[id] → Detalle workflow          │
│  └─ Notificaciones Pusher → Alertas real-time          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

# 🚀 FASE 1: MVP Básico (1 día)

## Objetivo

Dashboard básico con lista de workflows y últimas ejecuciones.

---

## 1.1 Backend API - Workflows Endpoint

### Archivo: `app/api/n8n/workflows/route.ts`

- [ ] Crear endpoint GET para listar todos los workflows
- [ ] Implementar fetch a n8n API con autenticación
- [ ] Agregar manejo de errores
- [ ] Validar API key configurada
- [ ] Transformar respuesta de n8n al formato interno
- [ ] (Opcional) Agregar cache con Redis (5 min TTL)

**Código Base:**

```typescript
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

const N8N_URL = process.env.N8N_URL
const N8N_API_KEY = process.env.N8N_API_KEY

export async function GET() {
  try {
    // Validar autenticación
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validar configuración
    if (!N8N_URL || !N8N_API_KEY) {
      return NextResponse.json({ error: "n8n not configured" }, { status: 500 })
    }

    // Fetch workflows desde n8n
    const response = await fetch(`${N8N_URL}/api/v1/workflows`, {
      headers: {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`n8n API error: ${response.status}`)
    }

    const workflows = await response.json()

    // Transformar respuesta
    const transformedWorkflows = workflows.data.map((w: any) => ({
      id: w.id,
      name: w.name,
      active: w.active,
      tags: w.tags || [],
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      nodes: w.nodes?.length || 0,
    }))

    return NextResponse.json({ workflows: transformedWorkflows })
  } catch (error) {
    console.error("Error fetching n8n workflows:", error)
    return NextResponse.json({ error: "Failed to fetch workflows" }, { status: 500 })
  }
}
```

---

## 1.2 Backend API - Executions Endpoint

### Archivo: `app/api/n8n/executions/route.ts`

- [ ] Crear endpoint GET para historial de ejecuciones
- [ ] Agregar parámetros de query (limit, offset, status, workflowId)
- [ ] Implementar fetch a n8n API
- [ ] Transformar respuesta con datos relevantes
- [ ] Agregar paginación

**Código Base:**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

const N8N_URL = process.env.N8N_URL
const N8N_API_KEY = process.env.N8N_API_KEY

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parámetros de query
    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get("limit") || "50"
    const workflowId = searchParams.get("workflowId")
    const status = searchParams.get("status") // success, error, waiting

    // Construir URL
    let url = `${N8N_URL}/api/v1/executions?limit=${limit}`
    if (workflowId) url += `&workflowId=${workflowId}`
    if (status) url += `&status=${status}`

    const response = await fetch(url, {
      headers: {
        "X-N8N-API-KEY": N8N_API_KEY!,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`n8n API error: ${response.status}`)
    }

    const executions = await response.json()

    // Transformar respuesta
    const transformedExecutions = executions.data.map((e: any) => ({
      id: e.id,
      workflowId: e.workflowId,
      workflowName: e.workflowData?.name || "Unknown",
      status: e.finished ? (e.data?.resultData?.error ? "error" : "success") : "waiting",
      startedAt: e.startedAt,
      stoppedAt: e.stoppedAt,
      duration:
        e.stoppedAt && e.startedAt
          ? new Date(e.stoppedAt).getTime() - new Date(e.startedAt).getTime()
          : null,
      error: e.data?.resultData?.error?.message || null,
      mode: e.mode, // manual, trigger, webhook, etc.
    }))

    return NextResponse.json({
      executions: transformedExecutions,
      total: executions.data.length,
    })
  } catch (error) {
    console.error("Error fetching n8n executions:", error)
    return NextResponse.json({ error: "Failed to fetch executions" }, { status: 500 })
  }
}
```

---

## 1.3 TypeScript Types

### Archivo: `lib/types/n8n.ts`

- [ ] Crear tipos TypeScript para workflows
- [ ] Crear tipos para executions
- [ ] Crear tipos para métricas

```typescript
export interface N8NWorkflow {
  id: string
  name: string
  active: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
  nodes: number
}

export interface N8NExecution {
  id: string
  workflowId: string
  workflowName: string
  status: "success" | "error" | "waiting" | "running"
  startedAt: string
  stoppedAt: string | null
  duration: number | null
  error: string | null
  mode: string
}

export interface N8NMetrics {
  totalWorkflows: number
  activeWorkflows: number
  inactiveWorkflows: number
  executionsToday: number
  successRate: number
  averageDuration: number
  errorsToday: number
}
```

---

## 1.4 Frontend - Página Principal

### Archivo: `app/(pages)/automatizaciones/page.tsx`

- [ ] Crear página básica con MainLayout
- [ ] Implementar data fetching con TanStack Query
- [ ] Agregar KPI cards (workflows activos, ejecuciones, errores)
- [ ] Crear tabla de workflows con TanStack Table
- [ ] Agregar indicadores de estado (badges)
- [ ] Agregar loading states y error handling

**Código Base:**

```typescript
"use client"

import { useQuery } from "@tanstack/react-query"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, CheckCircle2, XCircle, Clock } from "lucide-react"
import type { N8NWorkflow, N8NExecution, N8NMetrics } from "@/lib/types/n8n"

export default function AutomatizacionesPage() {
  // Fetch workflows
  const { data: workflowsData, isLoading: loadingWorkflows } = useQuery({
    queryKey: ["n8n-workflows"],
    queryFn: () => fetch("/api/n8n/workflows").then(r => r.json()),
    refetchInterval: 30000, // Refetch cada 30 segundos
  })

  // Fetch recent executions
  const { data: executionsData, isLoading: loadingExecutions } = useQuery({
    queryKey: ["n8n-executions"],
    queryFn: () => fetch("/api/n8n/executions?limit=50").then(r => r.json()),
    refetchInterval: 10000, // Refetch cada 10 segundos
  })

  const workflows: N8NWorkflow[] = workflowsData?.workflows || []
  const executions: N8NExecution[] = executionsData?.executions || []

  // Calcular métricas
  const metrics: N8NMetrics = {
    totalWorkflows: workflows.length,
    activeWorkflows: workflows.filter(w => w.active).length,
    inactiveWorkflows: workflows.filter(w => !w.active).length,
    executionsToday: executions.filter(e =>
      new Date(e.startedAt).toDateString() === new Date().toDateString()
    ).length,
    successRate: executions.length > 0
      ? (executions.filter(e => e.status === "success").length / executions.length) * 100
      : 0,
    averageDuration: executions.length > 0
      ? executions.reduce((acc, e) => acc + (e.duration || 0), 0) / executions.length
      : 0,
    errorsToday: executions.filter(e =>
      e.status === "error" &&
      new Date(e.startedAt).toDateString() === new Date().toDateString()
    ).length,
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">🤖 Automatizaciones n8n</h1>
          <p className="text-muted-foreground mt-2">
            Monitorea y gestiona tus workflows de automatización
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Workflows Activos
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.activeWorkflows}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  / {metrics.totalWorkflows}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ejecuciones Hoy
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.executionsToday}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.successRate.toFixed(1)}% tasa de éxito
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Errores Hoy
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {metrics.errorsToday}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tiempo Promedio
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(metrics.averageDuration / 1000).toFixed(1)}s
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflows Table */}
        <Card>
          <CardHeader>
            <CardTitle>Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingWorkflows ? (
              <p>Cargando workflows...</p>
            ) : workflows.length === 0 ? (
              <p className="text-muted-foreground">No hay workflows configurados</p>
            ) : (
              <div className="space-y-4">
                {workflows.map(workflow => (
                  <div
                    key={workflow.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{workflow.name}</h3>
                        <Badge variant={workflow.active ? "default" : "secondary"}>
                          {workflow.active ? "✅ Activo" : "⏸️ Inactivo"}
                        </Badge>
                        {workflow.tags.map(tag => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {workflow.nodes} nodos •
                        Actualizado: {new Date(workflow.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Executions */}
        <Card>
          <CardHeader>
            <CardTitle>Ejecuciones Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingExecutions ? (
              <p>Cargando ejecuciones...</p>
            ) : executions.length === 0 ? (
              <p className="text-muted-foreground">No hay ejecuciones recientes</p>
            ) : (
              <div className="space-y-2">
                {executions.slice(0, 10).map(execution => (
                  <div
                    key={execution.id}
                    className="flex items-center justify-between p-3 border rounded hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {execution.status === "success" && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {execution.status === "error" && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      {execution.status === "waiting" && (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {execution.workflowName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(execution.startedAt).toLocaleString()}
                          {execution.duration && ` • ${(execution.duration / 1000).toFixed(2)}s`}
                        </p>
                        {execution.error && (
                          <p className="text-xs text-red-500 mt-1">{execution.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
```

---

## 1.5 Navegación

### Archivo: `components/layout/Sidebar.tsx`

- [ ] Agregar link a página de automatizaciones
- [ ] Agregar ícono apropiado (Activity o Zap)
- [ ] (Opcional) Agregar badge con contador de errores

**Código a agregar:**

```typescript
{
  href: "/automatizaciones",
  label: "Automatizaciones",
  icon: Activity,
}
```

---

## ✅ Checklist Fase 1

- [ ] Backend: Endpoint `/api/n8n/workflows`
- [ ] Backend: Endpoint `/api/n8n/executions`
- [ ] Backend: Types en `lib/types/n8n.ts`
- [ ] Frontend: Página `/automatizaciones`
- [ ] Frontend: KPI cards (4 métricas)
- [ ] Frontend: Tabla de workflows
- [ ] Frontend: Lista de ejecuciones recientes
- [ ] Frontend: Loading states
- [ ] Frontend: Error handling
- [ ] Navegación: Link en sidebar
- [ ] Testing: Verificar que datos se muestran correctamente
- [ ] Testing: Verificar refresh automático funciona

---

# 🚀 FASE 2: Detalles y Filtros (1-2 días)

## Objetivo

Vista detallada de workflows, filtros avanzados, y timeline de ejecuciones.

---

## 2.1 Backend - Workflow Detail Endpoint

### Archivo: `app/api/n8n/workflows/[id]/route.ts`

- [ ] Crear endpoint GET para un workflow específico
- [ ] Incluir información completa del workflow
- [ ] Incluir últimas ejecuciones del workflow
- [ ] Incluir estadísticas del workflow

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

const N8N_URL = process.env.N8N_URL
const N8N_API_KEY = process.env.N8N_API_KEY

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workflowId = params.id

    // Fetch workflow details
    const workflowResponse = await fetch(`${N8N_URL}/api/v1/workflows/${workflowId}`, {
      headers: {
        "X-N8N-API-KEY": N8N_API_KEY!,
        "Content-Type": "application/json",
      },
    })

    if (!workflowResponse.ok) {
      throw new Error(`n8n API error: ${workflowResponse.status}`)
    }

    const workflow = await workflowResponse.json()

    // Fetch recent executions for this workflow
    const executionsResponse = await fetch(
      `${N8N_URL}/api/v1/executions?workflowId=${workflowId}&limit=100`,
      {
        headers: {
          "X-N8N-API-KEY": N8N_API_KEY!,
          "Content-Type": "application/json",
        },
      }
    )

    const executionsData = await executionsResponse.json()
    const executions = executionsData.data || []

    // Calcular estadísticas
    const stats = {
      totalExecutions: executions.length,
      successCount: executions.filter((e: any) => e.finished && !e.data?.resultData?.error).length,
      errorCount: executions.filter((e: any) => e.data?.resultData?.error).length,
      averageDuration:
        executions.reduce((acc: number, e: any) => {
          if (e.stoppedAt && e.startedAt) {
            return acc + (new Date(e.stoppedAt).getTime() - new Date(e.startedAt).getTime())
          }
          return acc
        }, 0) / executions.length,
      lastExecution: executions[0]?.startedAt || null,
    }

    return NextResponse.json({
      workflow: {
        id: workflow.id,
        name: workflow.name,
        active: workflow.active,
        tags: workflow.tags || [],
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
        nodes: workflow.nodes || [],
        connections: workflow.connections || {},
      },
      stats,
      recentExecutions: executions.slice(0, 20).map((e: any) => ({
        id: e.id,
        status: e.finished ? (e.data?.resultData?.error ? "error" : "success") : "waiting",
        startedAt: e.startedAt,
        stoppedAt: e.stoppedAt,
        duration:
          e.stoppedAt && e.startedAt
            ? new Date(e.stoppedAt).getTime() - new Date(e.startedAt).getTime()
            : null,
        error: e.data?.resultData?.error?.message || null,
        mode: e.mode,
      })),
    })
  } catch (error) {
    console.error("Error fetching workflow details:", error)
    return NextResponse.json({ error: "Failed to fetch workflow details" }, { status: 500 })
  }
}
```

---

## 2.2 Backend - Toggle Workflow Endpoint

### Archivo: `app/api/n8n/workflows/[id]/toggle/route.ts`

- [ ] Crear endpoint PATCH para activar/desactivar workflow
- [ ] Validar permisos (solo admin/superadmin)
- [ ] Registrar acción en audit log
- [ ] Enviar notificación

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { logAuditAction } from "@/lib/audit-logger"

const N8N_URL = process.env.N8N_URL
const N8N_API_KEY = process.env.N8N_API_KEY

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role === "limitado") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workflowId = params.id
    const { active } = await request.json()

    // Get current workflow state
    const currentWorkflow = await fetch(`${N8N_URL}/api/v1/workflows/${workflowId}`, {
      headers: {
        "X-N8N-API-KEY": N8N_API_KEY!,
        "Content-Type": "application/json",
      },
    })

    const workflow = await currentWorkflow.json()

    // Update workflow
    const response = await fetch(`${N8N_URL}/api/v1/workflows/${workflowId}`, {
      method: "PUT",
      headers: {
        "X-N8N-API-KEY": N8N_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...workflow,
        active,
      }),
    })

    if (!response.ok) {
      throw new Error(`n8n API error: ${response.status}`)
    }

    // Log audit action
    await logAuditAction({
      entidad: "n8n_workflow",
      entidadId: workflowId,
      accion: "UPDATE",
      usuarioEmail: session.user.email!,
      cambiosAntes: { active: workflow.active },
      cambiosDespues: { active },
      descripcion: `Workflow ${workflow.name} ${active ? "activado" : "desactivado"}`,
    })

    return NextResponse.json({ success: true, active })
  } catch (error) {
    console.error("Error toggling workflow:", error)
    return NextResponse.json({ error: "Failed to toggle workflow" }, { status: 500 })
  }
}
```

---

## 2.3 Frontend - Página de Detalle

### Archivo: `app/(pages)/automatizaciones/[id]/page.tsx`

- [ ] Crear página de detalle de workflow
- [ ] Mostrar información completa del workflow
- [ ] Timeline de ejecuciones
- [ ] Estadísticas y gráficos
- [ ] Botones de acción (activar/desactivar, re-ejecutar)
- [ ] Diagrama visual del workflow (opcional)

---

## 2.4 Componentes - Filtros

### Archivo: `components/automatizaciones/WorkflowFilters.tsx`

- [ ] Crear componente de filtros
- [ ] Filtro por status (activo/inactivo)
- [ ] Filtro por tags
- [ ] Búsqueda por nombre
- [ ] Filtro por fecha de última ejecución

---

## 2.5 Componentes - Timeline

### Archivo: `components/automatizaciones/ExecutionTimeline.tsx`

- [ ] Crear componente de timeline
- [ ] Mostrar ejecuciones en orden cronológico
- [ ] Indicadores visuales de éxito/error
- [ ] Detalles expandibles
- [ ] Paginación

---

## ✅ Checklist Fase 2

- [ ] Backend: Endpoint workflow detail `/api/n8n/workflows/[id]`
- [ ] Backend: Endpoint toggle workflow `/api/n8n/workflows/[id]/toggle`
- [ ] Backend: Audit logging para cambios
- [ ] Frontend: Página de detalle `/automatizaciones/[id]`
- [ ] Frontend: Componente de filtros
- [ ] Frontend: Timeline de ejecuciones
- [ ] Frontend: Botón activar/desactivar
- [ ] Frontend: Estadísticas del workflow
- [ ] Frontend: Gráfico de ejecuciones por día
- [ ] Testing: Verificar filtros funcionan
- [ ] Testing: Verificar toggle funciona
- [ ] Testing: Verificar navegación entre páginas

---

# 🚀 FASE 3: Monitoreo Avanzado (1-2 días)

## Objetivo

Notificaciones real-time, webhooks, alertas automáticas, y dashboards de performance.

---

## 3.1 Backend - Webhook Receiver

### Archivo: `app/api/n8n/webhook/route.ts`

- [ ] Crear endpoint POST para recibir webhooks de n8n
- [ ] Validar webhook signature (si está configurado)
- [ ] Procesar eventos (workflow_started, workflow_completed, workflow_failed)
- [ ] Crear notificaciones en base de datos
- [ ] Enviar notificaciones via Pusher
- [ ] Registrar en audit log

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notification-service"
import crypto from "crypto"

const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET

function validateWebhookSignature(payload: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return false

  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET)
  const expectedSignature = hmac.update(payload).digest("hex")

  return signature === expectedSignature
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-n8n-signature")

    // Validar signature (opcional pero recomendado)
    if (WEBHOOK_SECRET && !validateWebhookSignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(body)

    // Procesar según tipo de evento
    switch (event.type) {
      case "workflow_failed":
        await handleWorkflowFailed(event)
        break
      case "workflow_completed":
        await handleWorkflowCompleted(event)
        break
      case "workflow_started":
        await handleWorkflowStarted(event)
        break
      default:
        console.log("Unknown event type:", event.type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing n8n webhook:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}

async function handleWorkflowFailed(event: any) {
  // Crear notificación de error
  await createNotification({
    tipo: "error",
    titulo: `Workflow Fallido: ${event.workflowName}`,
    descripcion: event.error || "El workflow ha fallado",
    icono: "XCircle",
    entidad: "n8n_workflow",
    entidadId: event.workflowId,
    url: `/automatizaciones/${event.workflowId}`,
    prioridad: "high",
  })
}

async function handleWorkflowCompleted(event: any) {
  // Solo notificar si es importante o tiene tag específico
  if (event.tags?.includes("notify-on-success")) {
    await createNotification({
      tipo: "success",
      titulo: `Workflow Completado: ${event.workflowName}`,
      descripcion: `Ejecutado exitosamente en ${event.duration}ms`,
      icono: "CheckCircle2",
      entidad: "n8n_workflow",
      entidadId: event.workflowId,
      prioridad: "low",
    })
  }
}

async function handleWorkflowStarted(event: any) {
  // Log opcional, no notificar
  console.log(`Workflow started: ${event.workflowName}`)
}
```

---

## 3.2 Configurar n8n para Enviar Webhooks

- [ ] En n8n, ir a Settings → Webhooks
- [ ] Configurar webhook URL: `https://importacion.curetcore.com/api/n8n/webhook`
- [ ] Seleccionar eventos a notificar (workflow failed, completed)
- [ ] (Opcional) Configurar secret para validación

**Documentación:**

```markdown
### Configuración de Webhooks en n8n

1. Accede a tu instancia de n8n
2. Ve a Settings → Webhooks
3. Agrega una nueva webhook URL:
   - URL: https://importacion.curetcore.com/api/n8n/webhook
   - Eventos: workflow_failed, workflow_completed
   - Secret: [mismo valor que N8N_WEBHOOK_SECRET en .env]

4. Guarda la configuración
```

---

## 3.3 Backend - Métricas y Analytics

### Archivo: `app/api/n8n/metrics/route.ts`

- [ ] Crear endpoint para métricas agregadas
- [ ] Calcular estadísticas por día/semana/mes
- [ ] Datos para gráficos (ejecuciones por día, success rate, etc.)
- [ ] Top workflows por uso
- [ ] Top workflows con más errores

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

const N8N_URL = process.env.N8N_URL
const N8N_API_KEY = process.env.N8N_API_KEY

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get("days") || "7")

    // Fetch executions de los últimos N días
    const response = await fetch(`${N8N_URL}/api/v1/executions?limit=1000`, {
      headers: {
        "X-N8N-API-KEY": N8N_API_KEY!,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()
    const executions = data.data || []

    // Filtrar por rango de fechas
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const recentExecutions = executions.filter((e: any) => new Date(e.startedAt) >= cutoffDate)

    // Agrupar por día
    const executionsByDay = recentExecutions.reduce((acc: any, e: any) => {
      const day = new Date(e.startedAt).toISOString().split("T")[0]
      if (!acc[day]) {
        acc[day] = { total: 0, success: 0, error: 0 }
      }
      acc[day].total++
      if (e.finished && !e.data?.resultData?.error) {
        acc[day].success++
      } else if (e.data?.resultData?.error) {
        acc[day].error++
      }
      return acc
    }, {})

    // Convertir a array para gráficos
    const chartData = Object.entries(executionsByDay).map(([day, stats]: [string, any]) => ({
      date: day,
      total: stats.total,
      success: stats.success,
      error: stats.error,
      successRate: (stats.success / stats.total) * 100,
    }))

    // Top workflows por uso
    const workflowStats = recentExecutions.reduce((acc: any, e: any) => {
      const workflowId = e.workflowId
      if (!acc[workflowId]) {
        acc[workflowId] = {
          id: workflowId,
          name: e.workflowData?.name || "Unknown",
          executions: 0,
          errors: 0,
          totalDuration: 0,
        }
      }
      acc[workflowId].executions++
      if (e.data?.resultData?.error) {
        acc[workflowId].errors++
      }
      if (e.stoppedAt && e.startedAt) {
        acc[workflowId].totalDuration +=
          new Date(e.stoppedAt).getTime() - new Date(e.startedAt).getTime()
      }
      return acc
    }, {})

    const topWorkflows = Object.values(workflowStats)
      .sort((a: any, b: any) => b.executions - a.executions)
      .slice(0, 10)

    return NextResponse.json({
      chartData,
      topWorkflows,
      summary: {
        totalExecutions: recentExecutions.length,
        successRate:
          recentExecutions.length > 0
            ? (recentExecutions.filter((e: any) => e.finished && !e.data?.resultData?.error)
                .length /
                recentExecutions.length) *
              100
            : 0,
        totalErrors: recentExecutions.filter((e: any) => e.data?.resultData?.error).length,
      },
    })
  } catch (error) {
    console.error("Error fetching n8n metrics:", error)
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}
```

---

## 3.4 Frontend - Dashboard de Performance

### Archivo: `components/automatizaciones/PerformanceDashboard.tsx`

- [ ] Crear componente con gráficos de performance
- [ ] LineChart de ejecuciones por día
- [ ] BarChart de success rate
- [ ] Top workflows por uso
- [ ] Tabla de workflows con más errores

```typescript
"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

export function PerformanceDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["n8n-metrics"],
    queryFn: () => fetch("/api/n8n/metrics?days=7").then(r => r.json()),
    refetchInterval: 60000, // Cada minuto
  })

  if (isLoading) {
    return <div>Cargando métricas...</div>
  }

  return (
    <div className="space-y-6">
      {/* Gráfico de Ejecuciones por Día */}
      <Card>
        <CardHeader>
          <CardTitle>Ejecuciones (Últimos 7 días)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#8884d8"
                name="Total"
              />
              <Line
                type="monotone"
                dataKey="success"
                stroke="#82ca9d"
                name="Éxitos"
              />
              <Line
                type="monotone"
                dataKey="error"
                stroke="#ff4444"
                name="Errores"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Success Rate por Día */}
      <Card>
        <CardHeader>
          <CardTitle>Tasa de Éxito (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="successRate" fill="#82ca9d" name="Success Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Workflows */}
      <Card>
        <CardHeader>
          <CardTitle>Top Workflows por Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data?.topWorkflows || []).map((workflow: any, index: number) => (
              <div
                key={workflow.id}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-muted-foreground">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{workflow.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {workflow.executions} ejecuciones •
                      {workflow.errors} errores
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {((workflow.executions - workflow.errors) / workflow.executions * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">éxito</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 3.5 Integrar PerformanceDashboard

### Archivo: `app/(pages)/automatizaciones/page.tsx`

- [ ] Agregar PerformanceDashboard a la página principal
- [ ] Agregar tab/sección separada para analytics

---

## 3.6 Notificaciones Real-time

### Archivo: `hooks/useN8NNotifications.ts`

- [ ] Crear hook para escuchar notificaciones de n8n
- [ ] Suscribirse a canal Pusher
- [ ] Mostrar toast cuando hay errores
- [ ] Actualizar queries cuando hay cambios

```typescript
import { useEffect } from "react"
import { usePusher } from "./usePusher"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useN8NNotifications() {
  const pusher = usePusher()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!pusher) return

    const channel = pusher.subscribe("n8n-events")

    channel.bind("workflow-failed", (data: any) => {
      toast.error(`Workflow Fallido: ${data.workflowName}`, {
        description: data.error || "Error desconocido",
        action: {
          label: "Ver Detalles",
          onClick: () => {
            window.location.href = `/automatizaciones/${data.workflowId}`
          },
        },
      })

      // Invalidar queries para refrescar datos
      queryClient.invalidateQueries({ queryKey: ["n8n-workflows"] })
      queryClient.invalidateQueries({ queryKey: ["n8n-executions"] })
    })

    channel.bind("workflow-completed", (data: any) => {
      // Solo mostrar toast si es importante
      if (data.notifyOnSuccess) {
        toast.success(`Workflow Completado: ${data.workflowName}`)
      }

      queryClient.invalidateQueries({ queryKey: ["n8n-executions"] })
    })

    return () => {
      channel.unbind("workflow-failed")
      channel.unbind("workflow-completed")
      pusher.unsubscribe("n8n-events")
    }
  }, [pusher, queryClient])
}
```

---

## 3.7 Actualizar Webhook Handler para Pusher

### Archivo: `app/api/n8n/webhook/route.ts`

- [ ] Agregar broadcast de eventos via Pusher
- [ ] Enviar eventos a canal `n8n-events`

```typescript
import { triggerPusherEvent } from "@/lib/pusher-server"

async function handleWorkflowFailed(event: any) {
  // ... código existente de notificación ...

  // Broadcast via Pusher
  await triggerPusherEvent("n8n-events", "workflow-failed", {
    workflowId: event.workflowId,
    workflowName: event.workflowName,
    error: event.error,
    timestamp: new Date().toISOString(),
  })
}
```

---

## ✅ Checklist Fase 3

- [ ] Backend: Endpoint webhook `/api/n8n/webhook`
- [ ] Backend: Validación de webhook signature
- [ ] Backend: Endpoint metrics `/api/n8n/metrics`
- [ ] Backend: Pusher broadcast en webhooks
- [ ] Frontend: PerformanceDashboard component
- [ ] Frontend: Hook useN8NNotifications
- [ ] Frontend: Gráficos de performance (LineChart, BarChart)
- [ ] Frontend: Top workflows por uso
- [ ] Frontend: Toast notifications para errores
- [ ] n8n: Configurar webhooks en settings
- [ ] Testing: Verificar webhooks se reciben correctamente
- [ ] Testing: Verificar notificaciones real-time funcionan
- [ ] Testing: Verificar gráficos muestran datos correctos

---

# 🚀 FASE 4: Acciones y Configuración (1 día - Opcional)

## Objetivo

Permitir acciones directas sobre workflows desde la UI y configuración de alertas personalizadas.

---

## 4.1 Backend - Re-ejecutar Workflow

### Archivo: `app/api/n8n/executions/[id]/retry/route.ts`

- [ ] Crear endpoint POST para re-ejecutar workflow
- [ ] Validar permisos
- [ ] Usar mismos datos de ejecución fallida
- [ ] Registrar en audit log

---

## 4.2 Backend - Configuración de Alertas

### Archivo: `prisma/schema.prisma`

- [ ] Crear modelo `N8NAlertConfig` para configurar alertas
- [ ] Campos: workflowId, alertOnError, alertOnSuccess, channels (email, pusher)

```prisma
model N8NAlertConfig {
  id              String   @id @default(cuid())
  workflowId      String   @unique
  workflowName    String
  alertOnError    Boolean  @default(true)
  alertOnSuccess  Boolean  @default(false)
  notifyEmail     Boolean  @default(false)
  notifyPusher    Boolean  @default(true)
  emails          String[] // Lista de emails a notificar
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

- [ ] Ejecutar migración: `npx prisma migrate dev --name add_n8n_alerts`

---

## 4.3 Backend - CRUD de Alertas

### Archivo: `app/api/n8n/alerts/route.ts`

- [ ] GET: Listar configuraciones de alertas
- [ ] POST: Crear configuración
- [ ] PUT: Actualizar configuración
- [ ] DELETE: Eliminar configuración

---

## 4.4 Frontend - Modal de Configuración

### Archivo: `components/automatizaciones/AlertConfigModal.tsx`

- [ ] Crear modal para configurar alertas por workflow
- [ ] Checkboxes: notificar en error, notificar en éxito
- [ ] Input para emails adicionales
- [ ] Toggle para canales de notificación

---

## 4.5 Frontend - Botones de Acción

### En página de detalle

- [ ] Botón "Re-ejecutar" para workflows fallidos
- [ ] Botón "Configurar Alertas"
- [ ] Botón "Ver en n8n" (link externo)
- [ ] Confirmaciones antes de acciones destructivas

---

## ✅ Checklist Fase 4

- [ ] Backend: Endpoint retry execution
- [ ] Backend: CRUD endpoints para alert config
- [ ] Database: Modelo N8NAlertConfig
- [ ] Database: Migración ejecutada
- [ ] Frontend: Modal de configuración de alertas
- [ ] Frontend: Botón re-ejecutar workflow
- [ ] Frontend: Botón configurar alertas
- [ ] Frontend: Link a n8n instance
- [ ] Testing: Verificar retry funciona
- [ ] Testing: Verificar alertas se configuran correctamente
- [ ] Testing: Verificar emails se envían (si configurado)

---

# 🧪 Testing & Validación

## Testing Manual

- [ ] **Conexión a n8n**: Verificar que la API de n8n responde correctamente
- [ ] **Workflows**: Lista se muestra completa y con datos correctos
- [ ] **Ejecuciones**: Historial se muestra ordenado por fecha
- [ ] **Filtros**: Todos los filtros funcionan correctamente
- [ ] **KPIs**: Métricas calculadas correctamente
- [ ] **Gráficos**: Charts se renderizan con datos reales
- [ ] **Notificaciones**: Toast aparece cuando hay errores
- [ ] **Real-time**: Pusher actualiza datos automáticamente
- [ ] **Toggle**: Activar/desactivar workflow funciona
- [ ] **Retry**: Re-ejecutar workflow funciona
- [ ] **Responsive**: UI se ve bien en mobile y desktop

## Testing E2E (Playwright)

### Archivo: `e2e/automatizaciones.spec.ts`

- [ ] Test: Cargar página de automatizaciones
- [ ] Test: Ver lista de workflows
- [ ] Test: Filtrar workflows por status
- [ ] Test: Ver detalle de workflow
- [ ] Test: Activar/desactivar workflow (admin)
- [ ] Test: Ver historial de ejecuciones
- [ ] Test: Verificar KPIs se calculan correctamente
- [ ] Test: Verificar gráficos se muestran

```typescript
import { test, expect } from "@playwright/test"
import { login, setupTestDatabase } from "./helpers/test-helpers"

test.describe("Automatizaciones n8n", () => {
  test.beforeEach(async ({ page }) => {
    await setupTestDatabase()
    await login(page, "admin@curetcore.com", "password")
  })

  test("debe mostrar página de automatizaciones", async ({ page }) => {
    await page.goto("/automatizaciones")
    await expect(page.locator("h1")).toContainText("Automatizaciones n8n")
    await expect(page.locator('[data-testid="kpi-workflows-activos"]')).toBeVisible()
  })

  test("debe listar workflows", async ({ page }) => {
    await page.goto("/automatizaciones")
    await expect(page.locator('[data-testid="workflow-item"]')).toHaveCount(3) // Asume 3 workflows de prueba
  })

  test("debe permitir activar/desactivar workflow (admin)", async ({ page }) => {
    await page.goto("/automatizaciones")

    const toggleButton = page.locator('[data-testid="workflow-toggle"]').first()
    await toggleButton.click()

    await expect(page.locator(".toast")).toContainText("Workflow actualizado")
  })

  test("debe mostrar detalle de workflow", async ({ page }) => {
    await page.goto("/automatizaciones")
    await page.locator('[data-testid="workflow-item"]').first().click()

    await expect(page.url()).toContain("/automatizaciones/")
    await expect(page.locator("h2")).toContainText("Detalles del Workflow")
  })
})
```

---

# 📝 Documentación

## README Section

### Archivo: `README.md`

- [ ] Agregar sección sobre módulo de automatizaciones n8n
- [ ] Documentar variables de entorno necesarias
- [ ] Instrucciones de configuración de webhooks

````markdown
## 🤖 Módulo de Automatizaciones n8n

CuretCore incluye un módulo completo de monitoreo para automatizaciones de n8n.

### Features

- 📊 Dashboard con KPIs y métricas en tiempo real
- 🔍 Monitoreo de workflows activos/inactivos
- 📈 Gráficos de performance y success rate
- 🔔 Notificaciones real-time de errores
- ⚡ Activar/desactivar workflows desde UI
- 🔄 Re-ejecutar workflows fallidos
- 📧 Alertas configurables por email

### Configuración

1. Habilitar API en n8n (Settings → API)
2. Generar API Key
3. Agregar variables de entorno:

```bash
N8N_URL="https://tu-n8n-instance.com"
N8N_API_KEY="tu_api_key"
N8N_WEBHOOK_SECRET="secret_opcional"
```
````

4. (Opcional) Configurar webhooks en n8n:
   - URL: `https://importacion.curetcore.com/api/n8n/webhook`
   - Eventos: `workflow_failed`, `workflow_completed`
   - Secret: mismo valor que `N8N_WEBHOOK_SECRET`

### Uso

Accede al módulo en `/automatizaciones` desde el sidebar.

````

---

## User Guide

### Archivo: `docs/GUIA-AUTOMATIZACIONES-N8N.md`

- [ ] Crear guía completa de usuario
- [ ] Screenshots y ejemplos
- [ ] Troubleshooting común

```markdown
# 🤖 Guía de Automatizaciones n8n

## Introducción

El módulo de automatizaciones te permite monitorear y gestionar todos tus workflows de n8n directamente desde CuretCore.

## Acceso

Desde el sidebar, haz clic en "Automatizaciones" para acceder al dashboard.

## Dashboard Principal

### KPIs
- **Workflows Activos**: Cantidad de workflows actualmente en ejecución
- **Ejecuciones Hoy**: Total de ejecuciones del día actual
- **Errores Hoy**: Ejecuciones fallidas del día
- **Tiempo Promedio**: Duración promedio de ejecuciones

### Lista de Workflows
Muestra todos los workflows configurados en n8n con:
- Nombre del workflow
- Estado (activo/inactivo)
- Tags asociados
- Última actualización
- Botón para activar/desactivar (solo admin)

### Ejecuciones Recientes
Timeline de las últimas 10 ejecuciones con:
- Nombre del workflow
- Status (éxito/error/esperando)
- Fecha y hora
- Duración
- Mensaje de error (si aplica)

## Detalle de Workflow

Haz clic en cualquier workflow para ver:
- Estadísticas completas
- Historial de ejecuciones
- Gráficos de performance
- Botones de acción (re-ejecutar, configurar alertas)

## Alertas y Notificaciones

### Notificaciones Real-time
Cuando un workflow falla, recibirás una notificación instantánea con:
- Nombre del workflow
- Mensaje de error
- Botón para ver detalles

### Configurar Alertas
1. Abre el detalle del workflow
2. Haz clic en "Configurar Alertas"
3. Selecciona:
   - Notificar en errores ✅
   - Notificar en éxitos
   - Enviar email
   - Emails adicionales

## Troubleshooting

### No se muestran workflows
- Verifica que `N8N_URL` y `N8N_API_KEY` estén configurados
- Verifica que la API esté habilitada en n8n
- Revisa los logs del servidor

### Webhooks no funcionan
- Verifica la URL del webhook en n8n
- Verifica que `N8N_WEBHOOK_SECRET` coincida
- Revisa logs en `/api/n8n/webhook`

### Notificaciones no llegan
- Verifica que Pusher esté configurado
- Verifica que `NEXT_PUBLIC_ENABLE_REALTIME_NOTIFICATIONS=true`
````

---

# 🚀 Deployment

## Checklist Pre-Deploy

- [ ] Variables de entorno configuradas en producción
- [ ] n8n API key válida
- [ ] Webhooks configurados en n8n
- [ ] (Opcional) Redis configurado para cache
- [ ] Pusher configurado para notificaciones
- [ ] Tests E2E pasando
- [ ] Documentación actualizada

## Deploy a Producción

- [ ] Push código a repositorio
- [ ] EasyPanel detecta cambios y hace rebuild
- [ ] Verificar que nuevas variables de entorno están en EasyPanel
- [ ] Verificar que el servicio inicia correctamente
- [ ] Probar acceso a `/automatizaciones`
- [ ] Verificar conexión con n8n funciona
- [ ] Probar webhook manualmente

## Post-Deploy Validation

- [ ] Dashboard carga correctamente
- [ ] Workflows se muestran
- [ ] Ejecuciones se muestran
- [ ] Gráficos renderizan datos
- [ ] Notificaciones funcionan
- [ ] Filtros funcionan
- [ ] Permisos funcionan correctamente (limitado vs admin)

---

# 📊 Resumen de Tiempo Estimado

| Fase              | Descripción        | Tiempo       | Complejidad     |
| ----------------- | ------------------ | ------------ | --------------- |
| **Fase 1**        | MVP Básico         | 1 día        | Fácil           |
| **Fase 2**        | Detalles y Filtros | 1-2 días     | Fácil-Medio     |
| **Fase 3**        | Monitoreo Avanzado | 1-2 días     | Medio           |
| **Fase 4**        | Acciones y Config  | 1 día        | Medio           |
| **Testing**       | E2E y Validación   | 0.5 día      | Fácil           |
| **Documentación** | Docs y Guías       | 0.5 día      | Fácil           |
| **TOTAL**         |                    | **3-5 días** | **Fácil-Medio** |

---

# ✅ Checklist General Final

## Desarrollo

- [ ] Todas las fases completadas
- [ ] Código revisado y limpio
- [ ] Sin console.logs innecesarios
- [ ] TypeScript sin errores
- [ ] ESLint sin warnings

## Testing

- [ ] Tests E2E escritos y pasando
- [ ] Testing manual completado
- [ ] Casos edge testeados
- [ ] Performance aceptable

## Documentación

- [ ] README actualizado
- [ ] Guía de usuario creada
- [ ] Variables de entorno documentadas
- [ ] Troubleshooting documentado

## Deployment

- [ ] Variables en producción
- [ ] Deploy exitoso
- [ ] Post-deploy validation pasada
- [ ] Monitoreo activo

## Usuario Final

- [ ] UX intuitiva y fluida
- [ ] Loading states claros
- [ ] Error messages útiles
- [ ] Responsive en mobile
- [ ] Notificaciones funcionando

---

# 🎯 Próximos Pasos Después de Completar

Una vez completado este módulo, puedes:

1. **Integrar con otros módulos**: Usar n8n para automatizar procesos de importación
2. **Expandir automatizaciones**: Crear workflows para:
   - Sincronización con Shopify
   - Reportes automáticos por email
   - Alertas de inventario bajo
   - Notificaciones de pagos vencidos
3. **Dashboard ejecutivo**: Agregar métricas de n8n al dashboard principal
4. **Módulo de Inventario**: Siguiente fase del CuretCore ecosystem

---

# 📚 Referencias

## APIs de n8n

- Documentación oficial: https://docs.n8n.io/api/
- Webhooks: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/

## Recursos Internos

- Arquitectura CuretCore: `docs/CURETCORE-ARCHITECTURE.md`
- Sistema de notificaciones: `docs/PLAN-NOTIFICACIONES-TIEMPO-REAL.md`
- Guía de configuración: `docs/GUIA-CONFIGURACION.md`

---

**Última actualización:** $(date +%Y-%m-%d)

**Status:** 🟢 Planificación Completa - Listo para Implementar
