/**
 * Campus Loop Stops (Name -> Earth Coordinates)
 * Library -> 41.008674, -76.445245
 * Mccormic -> 41.009118, -76.447059
 * Nelson Field -> 41.015415, -76.450112
 * Montgomery Place Apts -> 41.014352, -76.446527
 * Mt Olympus Apts -> 41.016437, -76.445937
 * Orange Lot -> 41.018184, -76.448860
 * Stadium -> 41.017498, -76.450388
 * JKA Apts -> 41.017353, -76.453079
 */

type Coordinates = {
  latitude: number;
  longitude: number;
};

type ServiceWindow = {
  day: string;
  hours: string;
  frequency: string;
  notes?: string;
};

class BusStop {
  id: string;
  name: string;
  coordinates: Coordinates;
  routeName: string;
  serviceWindows: ServiceWindow[];

  constructor(
    id: string,
    name: string,
    latitude: number,
    longitude: number,
    routeName: string,
    serviceWindows: ServiceWindow[]
  ) {
    this.id = id;
    this.name = name;
    this.coordinates = { latitude, longitude };
    this.routeName = routeName;
    this.serviceWindows = serviceWindows;
  }

  getLabel(): string {
    return `${this.id} - ${this.name}`;
  }

  getLocationString(): string {
    return `${this.coordinates.latitude}, ${this.coordinates.longitude}`;
  }

  printStopInfo(): void {
    console.log(`${this.getLabel()} (${this.getLocationString()})`);
  }
}

const campusLoopSchedule: ServiceWindow[] = [
  {
    day: "Monday-Friday",
    hours: "7:30 a.m. - midnight",
    frequency: "Approximately every 15 minutes",
  },
  {
    day: "Saturday",
    hours: "11:30 a.m. - 6:30 p.m.",
    frequency: "Approximately every 20 minutes",
    notes:
      "Last bus departs at 6:30 p.m. (NO SERVICE FROM 2:00 - 2:45 p.m. and 4:45 - 5:30 p.m.)",
  },
  {
    day: "Sunday",
    hours: "11:30 a.m. - midnight",
    frequency: "Approximately every 20 minutes",
    notes:
      "Last bus departs at midnight (NO SERVICE FROM 2:00 - 2:45 p.m., 6:45 - 7:30 p.m., and 9:00 - 9:45 p.m.)",
  },
];

// main: initialize bus stop objects
function main(): BusStop[] {
  const busStops: BusStop[] = [
    new BusStop("BS-001", "Library", 41.008674, -76.445245, "Campus Loop", campusLoopSchedule),
    new BusStop("BS-002", "Mccormic", 41.009118, -76.447059, "Campus Loop", campusLoopSchedule),
    new BusStop("BS-003", "Nelson Field", 41.015415, -76.450112, "Campus Loop", campusLoopSchedule),
    new BusStop("BS-004", "Montgomery Place Apts", 41.014352, -76.446527, "Campus Loop", campusLoopSchedule),
    new BusStop("BS-005", "Mt Olympus Apts", 41.016437, -76.445937, "Campus Loop", campusLoopSchedule),
    new BusStop("BS-006", "Orange Lot", 41.018184, -76.44886, "Campus Loop", campusLoopSchedule),
    new BusStop("BS-007", "Stadium", 41.017498, -76.450388, "Campus Loop", campusLoopSchedule),
    new BusStop("BS-008", "JKA Apts", 41.017353, -76.453079, "Campus Loop", campusLoopSchedule),
  ];

  busStops.forEach((stop) => stop.printStopInfo());
  return busStops;
}

const campusLoopStops = main();

export { BusStop, campusLoopSchedule, campusLoopStops };
