/** Normaliza validación guardada en BD o respuesta de API para la UI. */
export function getValidationErrors(validation: {
  errors?: string[];
  errorMessages?: string[];
}): string[] {
  return validation.errors ?? validation.errorMessages ?? [];
}

export function serializeValidation(validation: {
  cardCount?: number | null;
  errors?: string[];
  errorMessages?: string[];
  warnings?: string[];
}) {
  return {
    cardCount: validation.cardCount ?? 0,
    errors: getValidationErrors(validation),
    warnings: validation.warnings ?? [],
  };
}
