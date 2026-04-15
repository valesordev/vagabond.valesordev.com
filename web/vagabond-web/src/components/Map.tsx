"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type LngLatLike, type Marker } from "maplibre-gl";
import { PMTiles, Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";

import { useMapStore } from "@/stores/mapStore";

type MapMarker = {
  id: string;
  lon: number;
  lat: number;
  label?: string;
};

type MapProps = {
  initialCenter?: [number, number];
  initialZoom?: number;
  markers?: MapMarker[];
  onMoveEnd?: (center: [number, number], zoom: number) => void;
};

const PMTILES_PROTOCOL = "pmtiles";
const pmtilesProtocol = new Protocol();
let protocolWired = false;

function ensurePmtilesProtocolRegistered() {
  if (protocolWired) {
    return;
  }

  maplibregl.addProtocol(PMTILES_PROTOCOL, pmtilesProtocol.tile);
  protocolWired = true;
}

function buildFallbackStyle(): maplibregl.StyleSpecification {
  return {
    version: 8,
    name: "fallback-dark",
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": "#0b1220",
        },
      },
    ],
  };
}

function buildPmtilesStyle(pmtilesUrl: string): maplibregl.StyleSpecification {
  return {
    version: 8,
    name: "pmtiles-base",
    sources: {
      base: {
        type: "raster",
        url: `pmtiles://${pmtilesUrl}`,
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [
      {
        id: "base",
        type: "raster",
        source: "base",
      },
    ],
  };
}

export default function Map({
  initialCenter = [0, 0],
  initialZoom = 4,
  markers = [],
  onMoveEnd,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<Marker[]>([]);
  const [cursorCenter, setCursorCenter] = useState<[number, number]>(initialCenter);
  const [cursorZoom, setCursorZoom] = useState<number>(initialZoom);

  const setViewport = useMapStore((state) => state.setViewport);
  const center = useMapStore((state) => state.center);
  const zoom = useMapStore((state) => state.zoom);
  const bearing = useMapStore((state) => state.bearing);

  const pmtilesUrl = process.env.NEXT_PUBLIC_PMTILES_URL?.trim();
  const style = useMemo(
    () => (pmtilesUrl ? buildPmtilesStyle(pmtilesUrl) : buildFallbackStyle()),
    [pmtilesUrl],
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    let disposed = false;

    const createMap = async () => {
      let mapStyle = style;

      if (pmtilesUrl) {
        ensurePmtilesProtocolRegistered();
        const pmtiles = new PMTiles(pmtilesUrl);
        pmtilesProtocol.add(pmtiles);
        try {
          await pmtiles.getHeader();
        } catch (error) {
          // Offline-first behavior: render map without base tiles on PMTiles failures.
          console.warn("Failed to load PMTiles archive. Rendering fallback map.", error);
          mapStyle = buildFallbackStyle();
        }
      }

      if (disposed || !mapContainerRef.current) {
        return;
      }

      const effectiveCenter =
        center[0] === 0 && center[1] === 0 && zoom === 4 ? initialCenter : center;
      const effectiveZoom =
        center[0] === 0 && center[1] === 0 && zoom === 4 ? initialZoom : zoom;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: effectiveCenter as LngLatLike,
        zoom: effectiveZoom,
        bearing,
        attributionControl: {},
      });

      map.addControl(new maplibregl.NavigationControl(), "top-right");

      map.on("move", () => {
        const nextCenter = map.getCenter();
        setCursorCenter([nextCenter.lng, nextCenter.lat]);
        setCursorZoom(map.getZoom());
      });

      map.on("moveend", () => {
        const nextCenter = map.getCenter();
        const nextZoom = map.getZoom();
        const nextBearing = map.getBearing();
        const viewportCenter: [number, number] = [nextCenter.lng, nextCenter.lat];

        setViewport({
          center: viewportCenter,
          zoom: nextZoom,
          bearing: nextBearing,
        });

        onMoveEnd?.(viewportCenter, nextZoom);
      });

      mapRef.current = map;
    };

    void createMap();

    return () => {
      disposed = true;

      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];

      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [bearing, center, initialCenter, initialZoom, onMoveEnd, pmtilesUrl, setViewport, style, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = [];

    markers.forEach((marker) => {
      const mapMarker = new maplibregl.Marker()
        .setLngLat([marker.lon, marker.lat])
        .addTo(map);

      if (marker.label) {
        mapMarker.getElement().title = marker.label;
      }

      markerRefs.current.push(mapMarker);
    });
  }, [markers]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/65 px-2 py-1 text-xs text-white">
        {`Lon ${cursorCenter[0].toFixed(5)} | Lat ${cursorCenter[1].toFixed(5)} | Zoom ${cursorZoom.toFixed(2)}`}
      </div>
    </div>
  );
}
