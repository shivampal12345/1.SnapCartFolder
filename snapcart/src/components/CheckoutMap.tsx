"use client";

import { motion } from "motion/react";
import { LocateFixed } from "lucide-react";
import L, { LatLngExpression } from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";

interface CheckoutMapProps {
  position: [number, number] | null;
  onPositionChange: (position: [number, number]) => void;
  onUseCurrentLocation: () => void;
}

const markerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/684/684908.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function DraggableMarker({
  position,
  onPositionChange,
}: {
  position: [number, number];
  onPositionChange: (position: [number, number]) => void;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(position as LatLngExpression, 15, { animate: true });
  }, [map, position]);

  return (
    <Marker
      icon={markerIcon}
      position={position as LatLngExpression}
      draggable={true}
      eventHandlers={{
        dragend: (e: L.LeafletEvent) => {
          const marker = e.target as L.Marker;
          const { lat, lng } = marker.getLatLng();
          onPositionChange([lat, lng]);
        },
      }}
    />
  );
}

function CheckoutMap({
  position,
  onPositionChange,
  onUseCurrentLocation,
}: CheckoutMapProps) {
  return (
    <div className="relative mt-6 h-[330px] rounded-xl overflow-hidden border border-gray-200 shadow-inner">
      {position && (
        <MapContainer
          center={position as LatLngExpression}
          zoom={13}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <DraggableMarker
            position={position}
            onPositionChange={onPositionChange}
          />
        </MapContainer>
      )}

      <motion.button
        whileTap={{ scale: 0.93 }}
        className="absolute bottom-4 right-4 bg-green-600 text-white shadow-lg rounded-full hover:bg-green-700
                transition-all p-3 flex items-center justify-center z-999"
        onClick={onUseCurrentLocation}
      >
        <LocateFixed size={22} />
      </motion.button>
    </div>
  );
}

export default CheckoutMap;
