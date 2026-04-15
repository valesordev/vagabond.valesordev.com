import { create } from "zustand";

type ViewportState = {
  center: [number, number];
  zoom: number;
  bearing: number;
  setViewport: (viewport: {
    center: [number, number];
    zoom: number;
    bearing: number;
  }) => void;
};

const mapStore = create<ViewportState>((set) => ({
  center: [0, 0],
  zoom: 4,
  bearing: 0,
  setViewport: (viewport) => set(viewport),
}));

export const useMapStore = mapStore;
