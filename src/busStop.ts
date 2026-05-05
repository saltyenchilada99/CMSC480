/**
 * Legacy bus-stop model for the Campus Loop schedule.
 *
 * The visible map markers live in src/components/busStop.tsx. This file keeps
 * a small class-based representation that can be reused for schedule-focused
 * experiments, tests, or command-line output.
 */

/** Geographic coordinate pair in conventional latitude/longitude order. */
type Coordinates = {
  latitude: number;
  longitude: number;
};

/** Human-readable service window for one route and day grouping. */
type ServiceWindow = {
  day: string;
  hours: string;
  frequency: string;
  notes?: string;
};

/** Class wrapper around one scheduled Campus Loop stop. */
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

  /** Returns a compact label suitable for logs or simple lists. */
  getLabel(): string {
    return `${this.id} - ${this.name}`;
  }

  /** Returns the stop coordinates as display text. */
  getLocationString(): string {
    return `${this.coordinates.latitude}, ${this.coordinates.longitude}`;
  }

  /** Prints a one-line summary of the stop for quick debugging. */
  printStopInfo(): void {
    console.log(`${this.getLabel()} (${this.getLocationString()})`);
  }
}

/** Published Campus Loop operating windows. */
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

/** Builds the class-based Campus Loop stop list without import-time logging. */
function buildCampusLoopStops(): BusStop[] {
  return [
    new BusStop("BS-001", "Library", 41.008674, -76.445245, "Campus Loop", campusLoopSchedule),
    new BusStop("BS-002", "McCormick", 41.009118, -76.447059, "Campus Loop", campusLoopSchedule),
    new BusStop("BS-003", "Nelson Field", 41.015415, -76.450112, "Campus Loop", campusLoopSchedule),
    new BusStop("BS-004", "Montgomery Place Apts", 41.014352, -76.446527, "Campus Loop", campusLoopSchedule),
    new BusStop("BS-005", "Mt Olympus Apts", 41.016437, -76.445937, "Campus Loop", campusLoopSchedule),
    new BusStop("BS-006", "Orange Lot", 41.018184, -76.44886, "Campus Loop", campusLoopSchedule),
    new BusStop("BS-007", "Stadium", 41.017498, -76.450388, "Campus Loop", campusLoopSchedule),
    new BusStop("BS-008", "JKA Apts", 41.017353, -76.453079, "Campus Loop", campusLoopSchedule),
  ];
}

/** Prebuilt Campus Loop stops exported for consumers that want the class form. */
const campusLoopStops = buildCampusLoopStops();

export { BusStop, campusLoopSchedule, campusLoopStops };
