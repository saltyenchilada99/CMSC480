import { mkdir, writeFile } from "node:fs/promises";

/**
 * Route GeoJSON generator.
 *
 * This one-off utility rebuilds public/routes/*.geojson from known campus stop
 * coordinates plus OSRM routing. The backend and frontend both consume those
 * generated files, so keeping this script documented makes route maintenance
 * reproducible for future reviewers.
 */

const routesDir = new URL("../public/routes/", import.meta.url);

/** Wraps a route coordinate list in a minimal GeoJSON FeatureCollection. */
function toFeatureCollection(name, routeCoords) {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name },
        geometry: {
          type: "LineString",
          coordinates: routeCoords.map(([lat, lng]) => [lng, lat]),
        },
      },
    ],
  };
}

/** Requests an OSRM walking route through ordered stops and returns lat/lng pairs. */
async function fetchOsrmRoute(stops) {
  const coordString = stops.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/foot/${coordString}?overview=full&geometries=geojson`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OSRM request failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (!json.routes || !json.routes[0]) {
    throw new Error("OSRM response did not include a route");
  }

  return json.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
}

/** Writes one generated route file into public/routes/. */
async function writeRoute(filename, name, coords) {
  await writeFile(
    new URL(filename, routesDir),
    `${JSON.stringify(toFeatureCollection(name, coords), null, 2)}\n`
  );
}

// Hand-tuned campus points are used where parking-lot geometry matters more
// than OSRM's public-road routing.
const lowerLoopStart = [41.00864, -76.44540];
const lowerLoopConnector = [41.00880, -76.44506];

const campusStops = [
  lowerLoopStart,
  [41.01525, -76.44961], // Nelson Field House
  [41.01740, -76.45308], // JKA stop
  [41.01703, -76.45398], // through JKA before looping back out
  [41.01820, -76.448865], // Orange Lot
  [41.01640, -76.44624], // MOA
  [41.01434, -76.44654], // MPA
  lowerLoopStart,
];

const manualParkingLotPath = [
  [41.00875, -76.44516],
  [41.00870, -76.44517],
  [41.00815, -76.44477],
  [41.00808, -76.44476],
  [41.00796, -76.44479],
  [41.00786, -76.44471],
  [41.00800, -76.44440],
];

const lowerLoopReturnPath = [
  [41.00800, -76.44440],
  [41.008748, -76.44501],
  lowerLoopConnector,
];

const downtownStops = [
  [41.00925, -76.44673],
  [41.00268, -76.45811],
  [41.00452, -76.45687],
  [41.00688, -76.45747],
  [41.00925, -76.44673],
];

const walmartStops = [
  [41.00864, -76.44540],
  [41.00872, -76.48541],
];

const walmartManualExit = [
  [41.00786, -76.44471],
  [41.00800, -76.44440],
  [41.00880, -76.44506],
  [41.00875, -76.44516],
  [41.00870, -76.44517],
  [41.00815, -76.44477],
  [41.00808, -76.44476],
  [41.00796, -76.44479],
  [41.00786, -76.44471],
  [41.00800, -76.44440],
];

await mkdir(routesDir, { recursive: true });

const campusOsrmCoords = await fetchOsrmRoute(campusStops);
await writeRoute("campus-loop.geojson", "Campus Loop", [
  lowerLoopConnector,
  ...manualParkingLotPath,
  ...lowerLoopReturnPath.slice(1),
  ...campusOsrmCoords.slice(1),
]);

const downtownOsrmCoords = await fetchOsrmRoute(downtownStops);
await writeRoute("downtown-loop.geojson", "Downtown Loop", downtownOsrmCoords);

const walmartOsrmCoords = await fetchOsrmRoute([
  walmartManualExit[walmartManualExit.length - 1],
  walmartStops[1],
]);
await writeRoute("walmart-trip.geojson", "Walmart Trip", [
  ...walmartManualExit,
  ...walmartOsrmCoords.slice(1),
]);
