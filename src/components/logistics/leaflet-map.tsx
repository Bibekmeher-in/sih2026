"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";

export interface MapWaypointItem {
  id?: string;
  name: string;
  sequence?: number;
  location: {
    latitude: number;
    longitude: number;
  };
  produceLoadKg?: number;
  farmerOrContactName?: string;
  stopType?: "ORIGIN" | "FARM_PICKUP" | "FPO_HUB" | "DESTINATION";
}

export interface MapVehicleItem {
  vehicleNumber: string;
  modelName?: string;
  driverName?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  temperatureCelsius?: number;
  status?: string;
}

interface LeafletMapProps {
  origin?: MapWaypointItem;
  pickups?: MapWaypointItem[];
  destination?: MapWaypointItem;
  traditionalPolyline?: [number, number][];
  optimizedPolyline?: [number, number][];
  activeVehicle?: MapVehicleItem;
  height?: string;
  showTraditional?: boolean;
  showOptimized?: boolean;
  onSelectWaypoint?: (item: MapWaypointItem) => void;
}

export default function LeafletMap({
  origin,
  pickups = [],
  destination,
  traditionalPolyline,
  optimizedPolyline,
  activeVehicle,
  height = "460px",
  showTraditional = true,
  showOptimized = true,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not yet created
    if (!mapInstanceRef.current) {
      const initialCenter: [number, number] = origin
        ? [origin.location.latitude, origin.location.longitude]
        : [19.9975, 73.7898]; // Nashik default

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 9,
        scrollWheelZoom: false,
      });

      // Free OpenStreetMap Tile Layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    // Clear previous layers
    layerGroup.clearLayers();

    const boundsPoints: [number, number][] = [];

    // Helper: Custom SVG DivIcon
    const createCustomIcon = (
      bgColor: string,
      textColor: string,
      label: string,
      sublabel?: string
    ) => {
      return L.divIcon({
        className: "custom-map-marker",
        html: `
          <div style="
            background: ${bgColor};
            color: ${textColor};
            padding: 4px 8px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            border: 2px solid white;
            white-space: nowrap;
          ">
            <span>${label}</span>
            ${sublabel ? `<span style="opacity: 0.85; font-size: 9px;">${sublabel}</span>` : ""}
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
    };

    // 1. Origin Depot Marker
    if (origin) {
      const origCoords: [number, number] = [origin.location.latitude, origin.location.longitude];
      boundsPoints.push(origCoords);
      const marker = L.marker(origCoords, {
        icon: createCustomIcon("#2563eb", "#ffffff", "🏛️ Depot", "Start"),
      });
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: #1e3a8a;">Origin Depot</strong><br/>
          ${origin.name}<br/>
          <span style="color: #64748b; font-size: 10px;">Nashik Logistics Center</span>
        </div>
      `);
      layerGroup.addLayer(marker);
    }

    // 2. Farm Gate Pickup Markers
    pickups.forEach((pickup, idx) => {
      const coords: [number, number] = [pickup.location.latitude, pickup.location.longitude];
      boundsPoints.push(coords);

      const seqNumber = pickup.sequence !== undefined ? pickup.sequence : idx + 1;
      const marker = L.marker(coords, {
        icon: createCustomIcon("#16a34a", "#ffffff", `P${seqNumber}`, `${pickup.produceLoadKg || ""}kg`),
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: #166534;">Stop #${seqNumber}: Farm Pickup</strong><br/>
          <strong>${pickup.name}</strong><br/>
          ${pickup.farmerOrContactName ? `Grower: ${pickup.farmerOrContactName}<br/>` : ""}
          Load: <strong>${pickup.produceLoadKg || 0} kg</strong>
        </div>
      `);
      layerGroup.addLayer(marker);
    });

    // 3. Destination Hub Marker
    if (destination) {
      const destCoords: [number, number] = [
        destination.location.latitude,
        destination.location.longitude,
      ];
      boundsPoints.push(destCoords);
      const marker = L.marker(destCoords, {
        icon: createCustomIcon("#dc2626", "#ffffff", "🏁 Mandi", "End"),
      });
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: #991b1b;">Destination</strong><br/>
          ${destination.name}<br/>
          <span style="color: #64748b; font-size: 10px;">Wholesale Terminal APMC</span>
        </div>
      `);
      layerGroup.addLayer(marker);
    }

    // 4. Active Fleet Vehicle Marker
    if (activeVehicle && activeVehicle.location) {
      const vehCoords: [number, number] = [
        activeVehicle.location.latitude,
        activeVehicle.location.longitude,
      ];
      boundsPoints.push(vehCoords);
      const marker = L.marker(vehCoords, {
        icon: createCustomIcon(
          "#f59e0b",
          "#000000",
          "🚚 Reefer",
          activeVehicle.temperatureCelsius ? `${activeVehicle.temperatureCelsius}°C` : ""
        ),
      });
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: #b45309;">Live Reefer Truck</strong><br/>
          ${activeVehicle.vehicleNumber} (${activeVehicle.modelName || "Tata Ace"})<br/>
          Driver: ${activeVehicle.driverName || "Fleet Driver"}<br/>
          Cold Chain Temp: <strong>${activeVehicle.temperatureCelsius || 16.4}°C</strong>
        </div>
      `);
      layerGroup.addLayer(marker);
    }

    // 5. Traditional Unoptimized Route Polyline (Dashed Slate)
    if (showTraditional && traditionalPolyline && traditionalPolyline.length > 1) {
      const tradLine = L.polyline(traditionalPolyline, {
        color: "#94a3b8",
        weight: 3,
        dashArray: "8, 8",
        opacity: 0.8,
      });
      tradLine.bindTooltip("Traditional Unoptimized Route", { sticky: true });
      layerGroup.addLayer(tradLine);
    }

    // 6. Optimized Nearest-Neighbor Route Polyline (Solid Emerald)
    if (showOptimized && optimizedPolyline && optimizedPolyline.length > 1) {
      const optLine = L.polyline(optimizedPolyline, {
        color: "#10b981",
        weight: 5,
        opacity: 0.95,
      });
      optLine.bindTooltip("✓ Optimized Nearest-Neighbor Route", { sticky: true });
      layerGroup.addLayer(optLine);
    }

    // Auto fit map bounds if points exist
    if (boundsPoints.length > 0) {
      const bounds = L.latLngBounds(boundsPoints);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [
    origin,
    pickups,
    destination,
    traditionalPolyline,
    optimizedPolyline,
    activeVehicle,
    showTraditional,
    showOptimized,
  ]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapContainerRef}
      style={{ height }}
      className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner z-0"
    />
  );
}
