/**
 * Formata entrada de CPF em tempo real: 000.000.000-00
 */
export function formatCpfInput(text: string): string {
  const d = text.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function cpfDigitsOnly(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

function calcCheckDigit(base: string, factor: number): number {
  let sum = 0;
  for (let i = 0; i < base.length; i++) {
    sum += parseInt(base[i], 10) * factor--;
  }
  const mod = (sum * 10) % 11;
  return mod === 10 ? 0 : mod;
}

/**
 * Valida dígitos verificadores do CPF (11 dígitos).
 */
export function isValidCpfDigits(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  const d1 = calcCheckDigit(d.slice(0, 9), 10);
  if (d1 !== parseInt(d[9], 10)) return false;
  const d2 = calcCheckDigit(d.slice(0, 10), 11);
  return d2 === parseInt(d[10], 10);
}
