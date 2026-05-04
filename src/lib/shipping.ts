// Expo stand coordinates (origin point)
export const STAND_LAT = -4.378208
export const STAND_LON = 121.552224

// Free shipping radius in meters
export const FREE_RADIUS_METERS = 100

// Shipping cost per kilometer beyond free radius (in Rupiah)
export const COST_PER_KM = 2000

/**
 * Calculate the distance between two GPS coordinates using the Haversine formula.
 * Returns the distance in meters.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Calculate shipping cost based on distance from stand.
 * Free within FREE_RADIUS_METERS, then COST_PER_KM for each km beyond.
 */
export function calculateShippingCost(distanceMeters: number): number {
  if (distanceMeters <= FREE_RADIUS_METERS) {
    return 0
  }

  const distanceBeyondFree = distanceMeters - FREE_RADIUS_METERS
  const kmBeyond = Math.ceil(distanceBeyondFree / 1000)
  return kmBeyond * COST_PER_KM
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}
