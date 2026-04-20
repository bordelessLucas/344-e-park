import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { VehicleData } from '../pages/AddVehicle/AddVehicle';
import { loadVehicles, upsertVehicle as upsertVehicleRemote } from '../services/vehicleService';
import { useAuth } from '../hooks/useAuth';

export interface VehiclesContextValue {
  vehicles: VehicleData[];
  vehiclesLoaded: boolean;
  refreshVehicles: () => Promise<void>;
  saveVehicle: (vehicle: VehicleData, editingIndex: number | undefined) => Promise<void>;
}

const VehiclesContext = createContext<VehiclesContextValue | undefined>(undefined);

export function VehiclesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false);

  const refreshVehicles = useCallback(async () => {
    if (!user) {
      setVehicles([]);
      setVehiclesLoaded(false);
      return;
    }
    try {
      const remote = await loadVehicles(user.uid);
      setVehicles(remote);
    } catch {
      /* keep previous */
    } finally {
      setVehiclesLoaded(true);
    }
  }, [user?.uid]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setVehicles([]);
        setVehiclesLoaded(true);
        return;
      }
      setVehiclesLoaded(false);
      try {
        const remote = await loadVehicles(user.uid);
        if (!cancelled) {
          setVehicles(remote);
          setVehiclesLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setVehiclesLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const saveVehicle = useCallback(
    async (vehicle: VehicleData, editingIndex: number | undefined) => {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      await upsertVehicleRemote(user.uid, vehicle);
      setVehicles((prev) => {
        if (editingIndex !== undefined) {
          return prev.map((v, idx) => (idx === editingIndex ? vehicle : v));
        }
        return [...prev, vehicle];
      });
      try {
        const remote = await loadVehicles(user.uid);
        setVehicles(remote);
      } catch {
        /* mantém estado otimista */
      }
    },
    [user?.uid]
  );

  const value = useMemo(
    () => ({
      vehicles,
      vehiclesLoaded,
      refreshVehicles,
      saveVehicle,
    }),
    [vehicles, vehiclesLoaded, refreshVehicles, saveVehicle]
  );

  return <VehiclesContext.Provider value={value}>{children}</VehiclesContext.Provider>;
}

export function useVehicles(): VehiclesContextValue {
  const ctx = useContext(VehiclesContext);
  if (ctx === undefined) {
    throw new Error('useVehicles deve ser usado dentro de VehiclesProvider');
  }
  return ctx;
}
