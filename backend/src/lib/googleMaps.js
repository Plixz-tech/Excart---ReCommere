export function generateGoogleMapsUrl(address) {
  if (!address) {
    return "";
  }

  const {
    latitude,
    longitude,
    line1,
    city,
    state,
    pinCode,
  } = address;

  if (
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }

  const query = [
    line1,
    city,
    state,
    pinCode,
  ]
    .filter(Boolean)
    .join(", ");

  if (!query) {
    return "";
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query
  )}`;
}