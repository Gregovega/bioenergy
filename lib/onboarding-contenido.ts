// =============================================================
// Contenido del onboarding guiado (punto 8), por rol.
// Para ajustar el texto de cualquier rol, edita aquí — no hace
// falta tocar el componente OnboardingGate.
// =============================================================

export type PasoOnboarding = {
  titulo: string
  contenido: string
}

export type ContenidoOnboarding = {
  bienvenida: PasoOnboarding
  pasos: PasoOnboarding[]
}

export const CONTENIDO_ONBOARDING: Record<string, ContenidoOnboarding> = {
  super_admin: {
    bienvenida: {
      titulo: 'Bienvenido al Mothership',
      contenido:
        'Tienes acceso completo a la plataforma. Este recorrido rápido te muestra dónde está cada cosa antes de empezar.',
    },
    pasos: [
      { titulo: 'Panel general', contenido: 'Resumen del estado del negocio apenas entras.' },
      {
        titulo: 'Caja y reservas',
        contenido:
          'Origen del dinero de la empresa, cuánto hay disponible en caja chica (con su tope diario) y en reserva, y el registro de gastos.',
      },
      {
        titulo: 'Fases, categorías y participaciones',
        contenido: 'Gestión de inversionistas: fases de inversión, categorías y nuevas participaciones.',
      },
      {
        titulo: 'Operación diaria',
        contenido: 'Pagos y referidos, nuevos clientes, nuevos equipos y asignación de instalaciones.',
      },
      {
        titulo: 'Fidelidad de clientes',
        contenido: 'Catálogo de recompensas y canjes pendientes de entregar.',
      },
      {
        titulo: 'Roles del staff',
        contenido:
          'Como super_admin puedes ver todo. Los demás roles (admin, crm, atencion) ven solo lo que les corresponde en el menú.',
      },
    ],
  },
  admin: {
    bienvenida: {
      titulo: 'Bienvenido al Mothership',
      contenido:
        'Tu rol es admin: ves las finanzas de la empresa además de la operación general. Este recorrido te muestra dónde está cada cosa.',
    },
    pasos: [
      { titulo: 'Panel general', contenido: 'Resumen del estado del negocio apenas entras.' },
      {
        titulo: 'Caja y reservas',
        contenido:
          'Origen del dinero de la empresa, cuánto hay disponible en caja chica (con su tope diario) y en reserva, y el registro de gastos.',
      },
      {
        titulo: 'Fases, categorías y participaciones',
        contenido: 'Gestión de inversionistas: fases de inversión, categorías y nuevas participaciones.',
      },
      {
        titulo: 'Operación diaria',
        contenido: 'Pagos y referidos, nuevos clientes, nuevos equipos y asignación de instalaciones.',
      },
      {
        titulo: 'Fidelidad de clientes',
        contenido: 'Catálogo de recompensas y canjes pendientes de entregar.',
      },
    ],
  },
  crm: {
    bienvenida: {
      titulo: 'Bienvenido al Mothership',
      contenido:
        'Tu rol es CRM: te enfocas en leads y clientes nuevos. No ves las secciones de finanzas de la empresa.',
    },
    pasos: [
      { titulo: 'Leads (CRM)', contenido: 'Sigue los contactos interesados hasta que se conviertan en clientes.' },
      { titulo: 'Nuevo cliente', contenido: 'Registra un cliente final nuevo cuando cierres uno.' },
      { titulo: 'Nueva participación', contenido: 'Registra una nueva participación de un inversionista.' },
    ],
  },
  atencion: {
    bienvenida: {
      titulo: 'Bienvenido al Mothership',
      contenido:
        'Tu rol es atención al público: te enfocas en pagos, clientes e instalaciones del día a día. No ves las secciones de finanzas de la empresa.',
    },
    pasos: [
      { titulo: 'Pagos y referidos', contenido: 'Confirma o rechaza los pagos que reportan los clientes.' },
      { titulo: 'Nuevo cliente / Nueva asignación', contenido: 'Registra clientes nuevos y asígnales un equipo.' },
      { titulo: 'Asignar instalación', contenido: 'Crea la orden de trabajo para que un técnico instale el equipo.' },
      {
        titulo: 'Fidelidad',
        contenido: 'Cuando un cliente canjea puntos, aquí marcas el canje como entregado.',
      },
    ],
  },
  tecnico: {
    bienvenida: {
      titulo: 'Bienvenido, técnico',
      contenido: 'Este panel te muestra tus órdenes de trabajo del día. Así se usa.',
    },
    pasos: [
      { titulo: 'Pendientes', contenido: 'Tus instalaciones, mantenimientos o reparaciones por hacer, ordenadas por fecha.' },
      {
        titulo: 'Al completar una visita',
        contenido: 'Confirma el número de serie del equipo y sube una foto para dejar constancia del trabajo.',
      },
      { titulo: 'Historial', contenido: 'Ahí quedan las órdenes que ya marcaste como completadas.' },
    ],
  },
  inversionista: {
    bienvenida: {
      titulo: 'Bienvenido a tu Portal del Inversionista',
      contenido: 'Aquí ves cuánto ganas y cuánto te corresponde. Este recorrido te muestra las secciones.',
    },
    pasos: [
      { titulo: 'Resumen', contenido: 'Tus participaciones activas, con el % de propiedad y lo pagado por cada una.' },
      {
        titulo: 'Reporte anual',
        contenido:
          'Impacto ambiental atribuible, informe fiscal por año listo para tu contador, historial mes a mes y tu red de referidos.',
      },
      {
        titulo: 'Reinversión',
        contenido: 'Si activas la reinversión automática, tus ganancias se acumulan para comprar equipos nuevos en vez de retirarse.',
      },
    ],
  },
  cliente: {
    bienvenida: {
      titulo: 'Bienvenido a Mi Servicio',
      contenido: 'Aquí ves tu equipo y reportas tus pagos. Este recorrido te muestra cómo funciona.',
    },
    pasos: [
      { titulo: 'Tu equipo', contenido: 'El estado de tu servicio y cuánto llevas devengado y pendiente en el ciclo actual.' },
      { titulo: 'Cómo pagar', contenido: 'Ahí están los datos para pagar y el botón para reportar tu comprobante.' },
      {
        titulo: 'Programa de fidelidad',
        contenido: 'Por cada pago puntual sumas puntos, canjeables por premios cuando estén disponibles.',
      },
    ],
  },
}
