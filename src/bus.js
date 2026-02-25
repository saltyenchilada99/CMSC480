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

class Bus {
  /**
   * @param {Object} apiBus
   */
  constructor(apiBus = {}) {
    this.id = "";
    this.name = "";
    this.lat = 0;
    this.lng = 0;
    this.heading = 0;
    this.speed = 0;
    this.status = "Unknown";
    this.lastUpdated = "";
    this.address = null;
    this.driver = null;

    this.updateFromApi(apiBus);
  }

  /**
   * Update this bus with fresh API data.
   * @param {Object} apiBus
   * @returns {Bus}
   */
  updateFromApi(apiBus = {}) {
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

  /**
   * Convenience helper for Leaflet/Map marker positioning.
   * @returns {{lat: number, lng: number}}
   */
  getPosition() {
    return { lat: this.lat, lng: this.lng };
  }

  /**
   * Return plain JSON-friendly object.
   * @returns {Object}
   */
  toJSON() {
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

  /**
   * Build a Bus from one API bus payload.
   * @param {Object} apiBus
   * @returns {Bus}
   */
  static fromApi(apiBus) {
    return new Bus(apiBus);
  }

  /**
   * Convert API response bus array into Bus instances.
   * @param {Object[]} apiBuses
   * @returns {Bus[]}
   */
  static listFromApi(apiBuses = []) {
    if (!Array.isArray(apiBuses)) return [];
    return apiBuses.map((item) => Bus.fromApi(item));
  }

  /**
   * Update an in-memory bus map by ID using latest API list.
   * Helpful for polling/WebSocket refreshes.
   *
   * @param {Map<string, Bus>} busMap
   * @param {Object[]} apiBuses
   * @returns {Map<string, Bus>}
   */
  static upsertIntoMap(busMap, apiBuses = []) {
    if (!(busMap instanceof Map)) {
      throw new Error("busMap must be a Map<string, Bus>");
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

