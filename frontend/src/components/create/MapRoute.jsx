import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { createDestinationMarkers, createStartEndMarkers } from "../../utils/mapUtils.jsx";


// Fix Leaflet marker icons for bundlers (Vite/Webpack)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function MapRoute({ value = {}, onChange, noPanel = false, errors = {} }) {
  const location = value.location ?? null;   // { lat, lng }
  const route = value.points ?? [];           // [[lat, lng], ...]
  const getError = (field) => errors[field];

  const center = useMemo(() => {
    if (location?.lat && location?.lng) {
      return [location.lat, location.lng];
    }
    return [41.7151, 44.8271]; // Default: Tbilisi
  }, [location]);

  function handleMapClick(latlng) {
    const nextRoute = [...route, [latlng.lat, latlng.lng]];

    onChange({
      ...value,
      location: location ?? { lat: latlng.lat, lng: latlng.lng },
      points: nextRoute,
    });
  }

  function undoLastPoint() {
    if (route.length === 0) return;

    onChange({
      ...value,
      points: route.slice(0, -1),
    });
  }

  function clearRoute() {
    onChange({
      ...value,
      points: [],
      location: null,
    });
  }

  const content = (
    <>
      {!noPanel && <h3>Map & Route</h3>}

      {/* Map container MUST have height */}
      <div style={{ height: 420, width: "100%", borderRadius: 12, overflow: "hidden" }}>
        <MapContainer
          center={center}
          zoom={11}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />

          <MapClickHandler onClick={handleMapClick} />

          {route.length > 1 && (
            <Polyline positions={route} color="#2d6a4f" weight={4} opacity={0.8} />
          )}

          {route.length > 0 && createStartEndMarkers(route)}
          {route.length > 0 && createDestinationMarkers(route)}
        </MapContainer>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button type="button" onClick={undoLastPoint} disabled={route.length === 0}>
          Undo last point
        </button>

        <button type="button" onClick={clearRoute} disabled={route.length === 0}>
          Clear route
        </button>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#777" }}>
        Click the map to add route points. First click sets the hike location.
      </div>

      {/* Error messages */}
      {(errors?.points || errors?.location) && (
        <div className="map-errors">
          {errors.points && <div className="field-error">{errors.points}</div>}
          {errors.location && <div className="field-error">{errors.location}</div>}
        </div>
      )}

      {/* Debug info (safe to keep or remove later) */}
      <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
        <div>
          <b>Location:</b>{" "}
          {location
            ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
            : "not set"}
        </div>
        <div>
          <b>Route points:</b> {route.length}
        </div>
      </div>
    </>
  );

  return noPanel ? content : (
    <div className="panel">
      {content}
    </div>
  );
}

function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}
