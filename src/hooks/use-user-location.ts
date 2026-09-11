"use client";

import { useState, useCallback } from "react";
import { reverseGeocodeCoordinates, GeocodedAddress } from "@/lib/geocoding";

export type LocationPermissionState =
  | "prompt"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable"
  | "timeout";

export interface UserCoordinates {
  latitude: number;
  longitude: number;
}

export function useUserLocation() {
  const [permissionState, setPermissionState] = useState<LocationPermissionState>("prompt");
  const [coordinates, setCoordinates] = useState<UserCoordinates | null>(null);
  const [address, setAddress] = useState<GeocodedAddress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const requestLocation = useCallback(async (): Promise<{
    coordinates: UserCoordinates | null;
    address: GeocodedAddress | null;
    error: string | null;
  }> => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      const err = "Geolocation is not supported by your browser.";
      setError(err);
      setPermissionState("unavailable");
      return { coordinates: null, address: null, error: err };
    }

    setIsDetecting(true);
    setPermissionState("requesting");
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords: UserCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCoordinates(coords);
          setPermissionState("granted");

          // Attempt reverse geocoding to fill address
          try {
            const resolvedAddr = await reverseGeocodeCoordinates(coords.latitude, coords.longitude);
            setAddress(resolvedAddr);
            setIsDetecting(false);
            resolve({ coordinates: coords, address: resolvedAddr, error: null });
          } catch {
            setIsDetecting(false);
            resolve({ coordinates: coords, address: null, error: null });
          }
        },
        (geoError) => {
          setIsDetecting(false);
          let errText = "Unable to determine your location.";

          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              setPermissionState("denied");
              errText = "Location access was not granted. Please enter your address manually.";
              break;
            case geoError.POSITION_UNAVAILABLE:
              setPermissionState("unavailable");
              errText = "Location information is unavailable. Please enter your address manually.";
              break;
            case geoError.TIMEOUT:
              setPermissionState("timeout");
              errText = "Location request timed out. Please enter your address manually.";
              break;
            default:
              setPermissionState("unavailable");
          }

          setError(errText);
          resolve({ coordinates: null, address: null, error: errText });
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 60000, // 1 minute cached position
        }
      );
    });
  }, []);

  const openExplanationModal = () => setShowExplanation(true);
  const closeExplanationModal = () => setShowExplanation(false);

  return {
    permissionState,
    coordinates,
    address,
    error,
    isDetecting,
    showExplanation,
    openExplanationModal,
    closeExplanationModal,
    requestLocation,
  };
}
