/**
 * Bus class
 * Stores one bus record from backend API and provides update helpers.
 *
 * Expected API shape (from /api/buses):
 * {
 *   id, name, lat, lng, heading, speed, status,
 *   lastUpdated, address, driver
 * }
 */

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

type BusPosition = {
  lat: number;
  lng: number;
};

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

  getPosition(): BusPosition {
    return { lat: this.lat, lng: this.lng };
  }

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

  static fromApi(apiBus: ApiBus): Bus {
    return new Bus(apiBus);
  }

  static listFromApi(apiBuses: ApiBus[] = []): Bus[] {
    if (!Array.isArray(apiBuses)) return [];
    return apiBuses.map((item) => Bus.fromApi(item));
  }

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
