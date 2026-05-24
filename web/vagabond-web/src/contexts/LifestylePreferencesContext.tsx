"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type DensityMode = "comfortable" | "compact";
export type ConnectivityMode = "online" | "starlink" | "offline";

type LifestylePreferences = {
  density: DensityMode;
  connectivity: ConnectivityMode;
};

type LifestylePreferencesContextValue = LifestylePreferences & {
  setDensity: (density: DensityMode) => void;
  setConnectivity: (connectivity: ConnectivityMode) => void;
};

const LifestylePreferencesContext = createContext<LifestylePreferencesContextValue | null>(null);

const DEFAULTS: LifestylePreferences = {
  density: "comfortable",
  connectivity: "online",
};

type LifestylePreferencesProviderProps = {
  children: ReactNode;
};

export function LifestylePreferencesProvider({ children }: LifestylePreferencesProviderProps) {
  const [prefs, setPrefs] = useState<LifestylePreferences>(DEFAULTS);

  useEffect(() => {
    document.documentElement.setAttribute("data-density", prefs.density);
    document.documentElement.setAttribute("data-conn", prefs.connectivity);
  }, [prefs.density, prefs.connectivity]);

  const setDensity = useCallback((density: DensityMode) => {
    setPrefs((current) => ({ ...current, density }));
  }, []);

  const setConnectivity = useCallback((connectivity: ConnectivityMode) => {
    setPrefs((current) => ({ ...current, connectivity }));
  }, []);

  const value = useMemo(
    () => ({
      ...prefs,
      setDensity,
      setConnectivity,
    }),
    [prefs, setDensity, setConnectivity],
  );

  return (
    <LifestylePreferencesContext.Provider value={value}>{children}</LifestylePreferencesContext.Provider>
  );
}

export function useLifestylePreferences(): LifestylePreferencesContextValue {
  const context = useContext(LifestylePreferencesContext);
  if (!context) {
    throw new Error("useLifestylePreferences must be used within LifestylePreferencesProvider");
  }
  return context;
}
