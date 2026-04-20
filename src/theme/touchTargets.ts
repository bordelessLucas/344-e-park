/**
 * Alvos de toque confortáveis (evita erros de “dedo grosso”).
 * Referência: ~48dp Material / 44pt Apple com folga mínima.
 */
export const MIN_TOUCH = 48;

export const headerIconButton = {
  minWidth: MIN_TOUCH,
  minHeight: MIN_TOUCH,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
};

/** Ícones de ajuda / info ao lado de labels (ainda acima do mínimo usável). */
export const compactIconButton = {
  minWidth: 44,
  minHeight: 44,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
};
