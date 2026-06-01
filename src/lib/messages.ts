/** Textos de la aplicación (español). */

export const msg = {
  api: {
    unauthorized: "No autorizado",
    eventIdRequired: "Se requiere el ID del evento",
    eventNotFound: "Torneo no encontrado",
    eventNotFoundOrClosed: "Torneo no encontrado o cerrado",
    eventClosed: "El torneo está cerrado",
    decklistNotFound: "Lista no encontrada",
    decklistTextRequired: "Debes pegar tu lista de cartas",
    allFieldsRequired: "Todos los campos son obligatorios",
    deadlinePassed: "Ya pasó la hora límite para enviar listas",
    duplicatePopId:
      "Ya existe una lista con este Pop ID. Usa tu enlace personal para editarla.",
    invalidBirthDate: "Fecha de nacimiento no válida",
    validationFailed: "La lista no pasó la validación",
    saveFailed: "No se pudo guardar la lista",
    updateFailed: "No se pudo actualizar la lista",
    createEventFailed: "No se pudo crear el torneo",
    loginFailed: "Credenciales incorrectas",
    emailPasswordRequired: "Correo y contraseña son obligatorios",
    serverConfigError: "Error de configuración del servidor",
    nameDatesRequired:
      "Nombre, hora de inicio y hora límite de listas son obligatorios",
    deadlineBeforeStart:
      "La hora límite de listas debe ser anterior al inicio del torneo",
    storeNotFound: "Tienda no encontrada",
  },
  parser: {
    invalidQty: (line: string) => `Cantidad no válida en la línea: ${line}`,
    energyNoSet: (line: string) =>
      `Energía sin código de expansión (revisa manualmente): ${line}`,
    cannotParse: (line: string) => `No se pudo leer la línea: ${line}`,
    not60Cards: (count: number) =>
      `El mazo debe tener exactamente 60 cartas (ahora tiene ${count}).`,
  },
} as const;
