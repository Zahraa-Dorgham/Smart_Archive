const FIELD_LABELS: Record<string, string> = {
  code: 'code',
  code_barre: 'code-barres',
  code_barres: 'code-barres',
  idboit: 'identifiant du boitier',
  idDoc: 'identifiant du document',
  nom: 'nom'
};

const DUPLICATE_MESSAGES: Record<string, string> = {
  code: 'Ce code existe deja. Veuillez choisir un autre code.',
  code_barre: 'Ce code-barres existe deja. Veuillez choisir un autre code-barres.',
  code_barres: 'Ce code-barres existe deja. Veuillez choisir un autre code-barres.',
  idboit: 'Cet identifiant de boitier existe deja. Veuillez choisir un autre identifiant.',
  idDoc: 'Cet identifiant de document existe deja. Veuillez choisir un autre identifiant.',
  nom: 'Ce nom existe deja. Veuillez choisir un autre nom.'
};

function firstMessage(value: unknown): string | null {
  if (Array.isArray(value)) {
    return value.length ? firstMessage(value[0]) : null;
  }

  if (value && typeof value === 'object') {
    const nested = value as Record<string, unknown>;
    for (const key of Object.keys(nested)) {
      const message = firstMessage(nested[key]);
      if (message) {
        return message;
      }
    }
    return null;
  }

  return typeof value === 'string' ? value : null;
}

function isDuplicateMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes('unique') ||
    normalized.includes('duplicate') ||
    normalized.includes('existe deja') ||
    normalized.includes('existe déjà') ||
    normalized.includes('already exists') ||
    normalized.includes('doit etre unique') ||
    normalized.includes('doit être unique');
}

function duplicateFieldMessage(field: string): string {
  return DUPLICATE_MESSAGES[field] || `Cette valeur existe deja. Veuillez choisir une autre valeur.`;
}

function duplicateFieldFromMessage(message: string): string | null {
  const normalized = message.toLowerCase();
  return Object.keys(FIELD_LABELS).find(field => normalized.includes(field.toLowerCase())) || null;
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  const body = (error as { error?: unknown })?.error;

  if (!body) {
    return fallbackMessage;
  }

  const payload = body as Record<string, unknown>;
  const errors = (payload['errors'] && typeof payload['errors'] === 'object')
    ? payload['errors'] as Record<string, unknown>
    : payload;

  for (const field of Object.keys(FIELD_LABELS)) {
    const message = firstMessage(errors[field]);
    if (message && isDuplicateMessage(message)) {
      return duplicateFieldMessage(field);
    }
  }

  const detail = firstMessage(payload['detail']) || firstMessage(payload['error']) || firstMessage(errors);
  if (detail && isDuplicateMessage(detail)) {
    const field = duplicateFieldFromMessage(detail);
    return field ? duplicateFieldMessage(field) : 'Cette valeur existe deja. Veuillez choisir une autre valeur.';
  }

  return detail || fallbackMessage;
}
