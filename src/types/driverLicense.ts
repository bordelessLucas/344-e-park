// Tipos para documentos de habilitação (CNH)

export interface DriverLicense {
  id: string;
  number: string; // Número do registro (CNH)
  category: string; // A, B, C, D, E, AB, AC, AD, AE
  issueDate: string; // Data de emissão
  expiryDate: string; // Data de validade
  holderName: string; // Nome do titular
  cpf: string; // CPF do titular
  observations?: string; // Observações adicionais
  createdAt: string;
  updatedAt: string;
}

export type DriverLicenseCategory = 'A' | 'B' | 'C' | 'D' | 'E' | 'AB' | 'AC' | 'AD' | 'AE';
