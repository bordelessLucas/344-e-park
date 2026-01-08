// Serviço para gerenciar documentos de CNH com AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DriverLicense } from '../types/driverLicense';

const STORAGE_KEY = '@epark:driver_licenses';

// Buscar todas as CNHs armazenadas
export async function getAllDriverLicenses(): Promise<DriverLicense[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erro ao buscar CNHs:', error);
    return [];
  }
}

// Salvar uma nova CNH
export async function saveDriverLicense(license: Omit<DriverLicense, 'id' | 'createdAt' | 'updatedAt'>): Promise<DriverLicense> {
  try {
    const licenses = await getAllDriverLicenses();
    const newLicense: DriverLicense = {
      ...license,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedLicenses = [...licenses, newLicense];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLicenses));
    
    return newLicense;
  } catch (error) {
    console.error('Erro ao salvar CNH:', error);
    throw error;
  }
}

// Atualizar uma CNH existente
export async function updateDriverLicense(id: string, updates: Partial<Omit<DriverLicense, 'id' | 'createdAt'>>): Promise<DriverLicense | null> {
  try {
    const licenses = await getAllDriverLicenses();
    const index = licenses.findIndex(l => l.id === id);
    
    if (index === -1) {
      return null;
    }
    
    const updatedLicense: DriverLicense = {
      ...licenses[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    licenses[index] = updatedLicense;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(licenses));
    
    return updatedLicense;
  } catch (error) {
    console.error('Erro ao atualizar CNH:', error);
    throw error;
  }
}

// Excluir uma CNH
export async function deleteDriverLicense(id: string): Promise<boolean> {
  try {
    const licenses = await getAllDriverLicenses();
    const filteredLicenses = licenses.filter(l => l.id !== id);
    
    if (filteredLicenses.length === licenses.length) {
      return false; // CNH não encontrada
    }
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredLicenses));
    return true;
  } catch (error) {
    console.error('Erro ao excluir CNH:', error);
    throw error;
  }
}

// Verificar se uma CNH está vencida ou próxima do vencimento
export function checkLicenseStatus(expiryDate: string): {
  status: 'valid' | 'expiring' | 'expired';
  daysUntilExpiry: number;
} {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysUntil = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  let status: 'valid' | 'expiring' | 'expired' = 'valid';
  if (daysUntil < 0) {
    status = 'expired';
  } else if (daysUntil <= 30) {
    status = 'expiring';
  }
  
  return { status, daysUntilExpiry: daysUntil };
}
