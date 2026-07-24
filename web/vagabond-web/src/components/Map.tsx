"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import maplibregl, { type LngLatLike, type Marker } from "maplibre-gl";
import { PMTiles, Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";

import { type Waypoint } from "@/lib/api";
import { useMapStore } from "@/stores/mapStore";

const WAYPOINTS_SOURCE_ID = "trip-waypoints-source";
const WAYPOINTS_LAYER_ID = "trip-waypoints-circles";

type MapMarker = {
  id: string;
  lon: number;
  lat: number;
  label?: string;
};

export type MapHandle = {
  flyTo: (lon: number, lat: number) => void;
};

type MapProps = {
  initialCenter?: [number, number];
  initialZoom?: number;
  markers?: MapMarker[];
  waypoints?: Waypoint[];
  /** When `true`, first fetch has completed; used with `waypoints` for one-time bounds fit. */
  waypointsFetchComplete?: boolean;
  onMapClick?: (lon: number, lat: number) => void;
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function waypointsToFeatureCollection(waypoints: Waypoint[]): {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: { id: string; name: string; notes: string; visited: boolean };
  }>;
} {
  return {
    type: "FeatureCollection",
    features: waypoints.map((w) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [w.lon, w.lat],
      },
      properties: {
        id: w.id,
        name: w.name,
        notes: w.notes ?? "",
        visited: w.visited ?? false,
      },
    })),
  };
}

const Map = forwardRef<MapHandle, MapProps>(function Map(
  {
    initialCenter = [0, 0],
    initialZoom = 4,
    markers = [],
    waypoints,
    waypointsFetchComplete,
    onMapClick,
    onMoveEnd,
  },
  ref,
) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const waypointHoverCleanupRef = useRef<(() => void) | null>(null);
  const mapClickCleanupRef = useRef<(() => void) | null>(null);
  const initialWaypointCountCapturedRef = useRef<number | null>(null);
  const hasFittedInitialWaypointsRef = useRef(false);
  const [cursorCenter, setCursorCenter] = useState<[number, number]>(initialCenter);
  const [cursorZoom, setCursorZoom] = useState<number>(initialZoom);
  const [mapReady, setMapReady] = useState(false);
  const [basemapError, setBasemapError] = useState<string | null>(null);

  const setViewport = useMapStore((state) => state.setViewport);
  const center = useMapStore((state) => state.center);
  const zoom = useMapStore((state) => state.zoom);
  const bearing = useMapStore((state) => state.bearing);

  const pmtilesUrl = process.env.NEXT_PUBLIC_PMTILES_URL?.trim();
  const style = useMemo(
    () => (pmtilesUrl ? buildPmtilesStyle(pmtilesUrl) : buildFallbackStyle()),
    [pmtilesUrl],
  );

  useImperativeHandle(
    ref,
    () => ({
      flyTo: (lon: number, lat: number) => {
        const map = mapRef.current;
        if (!map) {
          return;
        }
        map.flyTo({
          center: [lon, lat],
          zoom: Math.max(map.getZoom(), 12),
        });
      },
    }),
    [],
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    let disposed = false;

    const createMap = async () => {
      let mapStyle = style;
      setBasemapError(null);

      if (!pmtilesUrl) {
        setBasemapError(
          "Offline basemap unavailable: set NEXT_PUBLIC_PMTILES_URL to a local PMTiles archive.",
        );
      } else {
        ensurePmtilesProtocolRegistered();
        const pmtiles = new PMTiles(pmtilesUrl);
        pmtilesProtocol.add(pmtiles);
        try {
          await pmtiles.getHeader();
        } catch (error) {
          console.warn("Failed to load PMTiles archive. Rendering fallback map.", error);
          mapStyle = buildFallbackStyle();
          setBasemapError(
            "Could not load the PMTiles basemap. Check NEXT_PUBLIC_PMTILES_URL and that the archive is reachable.",
          );
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

      map.on("load", () => {
        if (!disposed) {
          setMapReady(true);
        }
      });

      mapRef.current = map;
    };

    void createMap();

    return () => {
      disposed = true;

      waypointHoverCleanupRef.current?.();
      waypointHoverCleanupRef.current = null;
      mapClickCleanupRef.current?.();
      mapClickCleanupRef.current = null;

      popupRef.current?.remove();
      popupRef.current = null;

      const map = mapRef.current;
      if (map) {
        if (map.getLayer(WAYPOINTS_LAYER_ID)) {
          map.removeLayer(WAYPOINTS_LAYER_ID);
        }
        if (map.getSource(WAYPOINTS_SOURCE_ID)) {
          map.removeSource(WAYPOINTS_SOURCE_ID);
        }
      }

      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];

      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [bearing, center, initialCenter, initialZoom, onMoveEnd, pmtilesUrl, setViewport, style, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || waypoints === undefined) {
      return;
    }

    const attachHoverHandlers = () => {
      waypointHoverCleanupRef.current?.();
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: "240px",
      });
      popupRef.current = popup;

      const onEnter = (e: maplibregl.MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = e.features?.[0];
        const props = feature?.properties as
          | { name?: string; notes?: string; visited?: boolean | string }
          | undefined;
        if (!props) {
          return;
        }
        const name = props.name ?? "";
        const notes = props.notes ?? "";
        const visited = props.visited === true || props.visited === "true";
        const visitedHtml = visited
          ? `<div class="mt-1 text-xs text-emerald-300">Visited</div>`
          : "";
        const notesHtml =
          notes.trim().length > 0
            ? `<div class="mt-1 text-xs text-neutral-300">${escapeHtml(notes)}</div>`
            : "";
        popup
          .setLngLat(e.lngLat)
          .setHTML(
            `<div class="text-sm"><strong>${escapeHtml(name)}</strong>${visitedHtml}${notesHtml}</div>`,
          )
          .addTo(map);
      };

      const onLeave = () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      };

      map.on("mouseenter", WAYPOINTS_LAYER_ID, onEnter);
      map.on("mouseleave", WAYPOINTS_LAYER_ID, onLeave);

      waypointHoverCleanupRef.current = () => {
        map.off("mouseenter", WAYPOINTS_LAYER_ID, onEnter);
        map.off("mouseleave", WAYPOINTS_LAYER_ID, onLeave);
      };
    };

    if (!map.isStyleLoaded()) {
      return;
    }

    const source = map.getSource(WAYPOINTS_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(waypointsToFeatureCollection(waypoints));
      return;
    }

    map.addSource(WAYPOINTS_SOURCE_ID, {
      type: "geojson",
      data: waypointsToFeatureCollection(waypoints),
    });

    map.addLayer({
      id: WAYPOINTS_LAYER_ID,
      type: "circle",
      source: WAYPOINTS_SOURCE_ID,
      paint: {
        "circle-radius": 8,
        "circle-color": [
          "case",
          ["any", ["==", ["get", "visited"], true], ["==", ["get", "visited"], "true"]],
          "#16a34a",
          "#3b82f6",
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });

    attachHoverHandlers();
  }, [mapReady, waypoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) {
      return;
    }

    mapClickCleanupRef.current?.();
    mapClickCleanupRef.current = null;

    if (!onMapClick) {
      return;
    }

    const handler = (e: maplibregl.MapMouseEvent) => {
      onMapClick(e.lngLat.lng, e.lngLat.lat);
    };

    map.on("click", handler);
    mapClickCleanupRef.current = () => {
      map.off("click", handler);
    };

    return () => {
      mapClickCleanupRef.current?.();
      mapClickCleanupRef.current = null;
    };
  }, [mapReady, onMapClick]);

  useEffect(() => {
    if (waypointsFetchComplete !== true) {
      return;
    }
    if (initialWaypointCountCapturedRef.current !== null) {
      return;
    }
    initialWaypointCountCapturedRef.current = waypoints?.length ?? 0;
  }, [waypoints, waypointsFetchComplete]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map?.isStyleLoaded()) {
      return;
    }
    if (waypoints === undefined) {
      return;
    }
    if (initialWaypointCountCapturedRef.current === null || initialWaypointCountCapturedRef.current === 0) {
      return;
    }
    if (hasFittedInitialWaypointsRef.current) {
      return;
    }
    if (waypoints.length === 0) {
      return;
    }

    hasFittedInitialWaypointsRef.current = true;
    const bounds = new maplibregl.LngLatBounds();
    waypoints.forEach((w) => bounds.extend([w.lon, w.lat]));
    map.fitBounds(bounds, { padding: 60 });
  }, [mapReady, waypoints, waypointsFetchComplete]);

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
      {basemapError ? (
        <div
          role="alert"
          className="absolute left-3 right-3 top-3 z-10 rounded-md border border-amber-500/40 bg-amber-950/90 px-3 py-2 text-sm text-amber-50 shadow"
        >
          {basemapError}
        </div>
      ) : null}
      <div ref={mapContainerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/65 px-2 py-1 text-xs text-white">
        {`Lon ${cursorCenter[0].toFixed(5)} | Lat ${cursorCenter[1].toFixed(5)} | Zoom ${cursorZoom.toFixed(2)}`}
      </div>
    </div>
  );
});

export default Map;
