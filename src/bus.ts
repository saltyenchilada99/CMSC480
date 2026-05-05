/**
 * Frontend bus model helper.
 *
 * Most live-bus rendering now uses the typed LiveBus shape from
 * src/types/frontend.ts, but this class remains useful for tests, experiments,
 * and any code that wants to normalize raw /api/buses records into a small
 * object with update helpers.
 */

/** Raw bus record shape accepted from the backend API. */
type ApiBus = {
  id?: string | null;
  name?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  heading?: number | string | null;
  speed?: number | string | null;
  status?: string | null;
  lastUpdated?: string | null;
  address?: string | null;
  driver?: string | null;
};

/** Simple coordinate pair for consumers that do not need the full bus object. */
type BusPosition = {
  lat: number;
  lng: number;
};

/** Normalized client-side representation of one bus. */
class Bus {
  id: string;
  name: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  status: string;
  lastUpdated: string;
  address: string | null;
  driver: string | null;

  constructor(apiBus: ApiBus = {}) {
    this.id = '';
    this.name = '';
    this.lat = 0;
    this.lng = 0;
    this.heading = 0;
    this.speed = 0;
    this.status = 'Unknown';
    this.lastUpdated = '';
    this.address = null;
    this.driver = null;

    this.updateFromApi(apiBus);
  }

  /**
   * Merges a partial API payload into the existing object.
   *
   * Numeric values are coerced because API integrations sometimes serialize
   * numbers as strings.
   */
  updateFromApi(apiBus: ApiBus = {}): Bus {
    this.id = apiBus.id ?? this.id;
    this.name = apiBus.name ?? this.name;
    this.lat = Number(apiBus.lat ?? this.lat ?? 0);
    this.lng = Number(apiBus.lng ?? this.lng ?? 0);
    this.heading = Number(apiBus.heading ?? this.heading ?? 0);
    this.speed = Number(apiBus.speed ?? this.speed ?? 0);
    this.status = apiBus.status ?? this.status ?? "Unknown";
    this.lastUpdated = apiBus.lastUpdated ?? this.lastUpdated ?? "";
    this.address = apiBus.address ?? this.address ?? null;
    this.driver = apiBus.driver ?? this.driver ?? null;
    return this;
  }

  /** Returns the current bus coordinate pair. */
  getPosition(): BusPosition {
    return { lat: this.lat, lng: this.lng };
  }

  /** Returns a plain JSON-ready object for logging or serialization. */
  toJSON(): Required<ApiBus> {
    return {
      id: this.id,
      name: this.name,
      lat: this.lat,
      lng: this.lng,
      heading: this.heading,
      speed: this.speed,
      status: this.status,
      lastUpdated: this.lastUpdated,
      address: this.address,
      driver: this.driver,
    };
  }

  /** Creates one normalized Bus from a raw API record. */
  static fromApi(apiBus: ApiBus): Bus {
    return new Bus(apiBus);
  }

  /** Converts an API array into normalized Bus instances. */
  static listFromApi(apiBuses: ApiBus[] = []): Bus[] {
    if (!Array.isArray(apiBuses)) return [];
    return apiBuses.map((item) => Bus.fromApi(item));
  }

  /**
   * Updates a keyed Bus map in place while preserving existing object identity.
   *
   * This is useful for consumers that hold references to Bus instances and want
   * fresh API data without rebuilding the entire collection.
   */
  static upsertIntoMap(busMap: Map<string, Bus>, apiBuses: ApiBus[] = []): Map<string, Bus> {
    if (!(busMap instanceof Map)) {
      throw new Error('busMap must be a Map<string, Bus>');
    }

    for (const apiBus of apiBuses) {
      const id = apiBus?.id;
      if (!id) continue;

      const existing = busMap.get(id);
      if (existing) {
        existing.updateFromApi(apiBus);
      } else {
        busMap.set(id, new Bus(apiBus));
      }
    }

    return busMap;
  }
}

export default Bus;
export { Bus };
