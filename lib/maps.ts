const DEFAULT_LATITUDE_SPAN = 0.03;
const DEFAULT_LONGITUDE_SPAN = 0.04;

export function openStreetMapEmbedUrl(latitude: number, longitude: number) {
  const west = longitude - DEFAULT_LONGITUDE_SPAN;
  const south = latitude - DEFAULT_LATITUDE_SPAN;
  const east = longitude + DEFAULT_LONGITUDE_SPAN;
  const north = latitude + DEFAULT_LATITUDE_SPAN;
  const bbox = [west, south, east, north].map((coordinate) => coordinate.toFixed(6)).join(",");

  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${latitude},${longitude}`)}`;
}
