import { Marker, Popup } from 'react-leaflet';
// @ts-ignore
import { GetBusStopIcon } from './busMarkers.tsx';


type RouteInfo = {
    name: string;
    color: string;
};

const ROUTES: Record<string, RouteInfo> = {
    campus:   { name: "Campus Loop",    color: "#B8860B" },
    downtown: { name: "Downtown Loop",  color: "#6D0026" },
    walmart:  { name: "Walmart Trip",   color: "#0057B8" },
};

const STOP_ROUTES: Record<string, RouteInfo[]> = {
    'BS-1':  [ROUTES.campus, ROUTES.walmart],
    'BS-2':  [ROUTES.campus],
    'BS-3':  [ROUTES.campus],
    'BS-4':  [ROUTES.campus],
    'BS-5':  [ROUTES.campus],
    'BS-6':  [ROUTES.campus],
    'BS-7':  [ROUTES.downtown],
    'BS-8':  [ROUTES.downtown],
    'BS-9':  [ROUTES.downtown],
    'BS-10': [ROUTES.walmart],
    'BS-11': [ROUTES.downtown],
    'BS-12': [ROUTES.downtown],
    'BS-13': [ROUTES.downtown],
};
class busStop {
    name!: string;
    lat!: number;
    long!: number;
    desc!: string;
    location!: string;
    img!: string;
    key!: string;
}

const busStopLibrary: busStop[] = [{
    name: "Library, A&A Building",
    lat: 41.00865,
    long: 76.44525,
    desc: 'A Shared stop between the Library and the Arts & Administration Building.',
    location: 'Located on the corner of Swisher DR & Chestnut ST',
    img: '/busStopImages/library_and_aa_building.png',
    key: 'BS-1'
}, {
    name: "MPA",
    lat: 41.01429,
    long: 76.44654,
    desc: 'One of the earliest apartment stops near the Athletic Complex, the Montgomery Plaza ' +
        'Apartment Complex works as good in-between housing for Sports and Studying on the Campus.',
    location: 'Located on Welsh Circle towards the Athletic Complex',
    img: '/busStopImages/montgomery_plaza_apartments.png',
    key: 'BS-2'
}, {
    name: "Nelson Field House",
    lat: 41.01525,
    long: 76.44961,
    desc: 'This stop is the earliest stop in the Athletic Complex and acts as a direct link ' +
        'for the Nelson Field House to the NorthWest.',
    location: 'Located on the South end of the Welsh Circle',
    img: '/busStopImages/nelson_field_house.png',
    key: 'BS-3'
}, {
    name: "JKA",
    lat: 41.01735,
    long: 76.45308,
    desc: 'This stop is for the Jessica Kozloff Apartment Complex and is the closest housing to ' +
        'the Athletic Complex.',
    location: 'Located on Kozloff Drive',
    img: '/busStopImages/jessica_kozlof_apartments.png',
    key: 'BS-4'
}, {
    name: "Orange Lot",
    lat: 41.01820,
    long: 76.448865,
    desc: 'One of the only Parking Lots not requiring tags or tickets, sits snugly between the courts ' +
        'of the Athletic Complex.',
    location: 'Located on the North end of the Welsh Circle',
    img: '/busStopImages/orange_lot.png',
    key: 'BS-5'
}, {
    name: "MOA",
    lat: 41.01635,
    long: 76.44624,
    desc: 'A good substitute to the JKA, the Mount Olympus Apartment Complex works as extra living space ' +
        'to the Athletic Complex.',
    location: 'Stuart Edwards DR just off Welsh Circle',
    img: '/busStopImages/mount_olympus_apartments.png',
    key: 'BS-6'
}, {
    name: "M&GA",
    lat: 41.00401,
    long: 76.45426,
    desc: 'A series of penthouse style apartments, the Maroon & Gold Apartment Building offers a good ' +
        'view and fine, local shopping in downtown Bloomsburg.',
    location: 'Located on the corner of East Main ST & Catherine ST',
    img: '/busStopImages/maroon_and_gold_apartments.png',
    key: 'BS-7'
}, {
    name: "WHA",
    lat: 41.00708,
    long: 76.45697,
    desc: 'In terms of off-campus Housing, The Warhurst Apartments are a good choice for private living ' +
        'around the campus.',
    location: 'Located on the Corner of Glenn Ave & Iron ST',
    img: '/busStopImages/warhurst_apartments.png',
    key: 'BS-8'
}, {
    name: "GAA",
    lat: 41.00752,
    long: 76.45689,
    desc: 'A fine choice for off-campus Housing, the Glenn Avenue Apartments offers luxury housing for ' +
        'students as well as modern amenities.',
    location: 'Located on 203 Glenn Ave',
    img: '/busStopImages/glenn_avenue_apartments.png',
    key: 'BS-9'
}, {
    name: "Wal‑Mart",
    lat: 41.00872,
    long: 76.48541,
    desc: 'The Walmart Supercenter acts as a direct link for students to perform shopping for any ' +
        'luxuries required to get through the day-by-day living at Bloomsburg University.',
    location: 'Located at Buckhorn Plaza, 48 Plaza DR',
    img: '/busStopImages/bloomsburg_walmart.png',
    key: 'BS-10'
}, {
    name: "McCormick Center",
    lat: 41.00880,
    long: 76.44723,
    desc: 'The McCormick Center for the bus service is the gateway to Downtown Bloomsburg, ' +
        'providing a direct link to the shopping centers and living quarters.',
    location: 'Located at 400 E Second ST',
    img: '/busStopImages/mccormick_center.png',
    key: 'BS-11'
}, {
    name: "Fountain",
    lat: 41.00268,
    long: 76.45811,
    desc: 'The David Stroup Fountain, made in 1892, acts as a central Downtown stop for commuting ' +
        'between the University and any other living quarters not directly linked to Bloomsburg University.',
    location: 'Located at 157-199 Market ST',
    img: '/busStopImages/david_stroup_fountain.png',
    key: 'BS-12'
}, {
    name: "OSHA",
    lat: 41.00422,
    long: 76.45687,
    desc: 'The Housing of Choice, the Old School House Apartment Complex provides students and teaching ' +
        'staff alike the best choice for housing, while being comfortably situated between the neighboring shops.',
    location: 'Located on 50 E 1st ST',
    img: '/busStopImages/old_school_house_apartments.png',
    key: 'BS-13'
}];

export function BusStop() {
    return (
        busStopLibrary.map((busStop : busStop) => (
            <Marker
                key={`${busStop.key}`}
                position={[busStop.lat, -busStop.long]}
                icon={GetBusStopIcon()}
                zIndexOffset={500}
            >
                <Popup>
                    <div style={{ marginBottom: "4px" }}>
                        <strong>{busStop.name}</strong>
                    </div>
                    <div>{busStop.desc}</div>
                    <div style={{ marginBottom: "4px" }}>
                        <strong>{busStop.location}</strong>
                    </div>
                    <div style={{ marginTop: "8px", marginBottom: "4px" }}>
                        <strong>Routes:</strong>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                            {(STOP_ROUTES[busStop.key] ?? []).map((route) => (
                                <span
                                    key={route.name}
                                    style={{
                                        backgroundColor: route.color,
                                        color: "#fff",
                                        padding: "2px 8px",
                                        borderRadius: "12px",
                                        fontSize: "11px",
                                        fontWeight: "bold",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {route.name}
                                </span>
                            ))}
                        </div>
                    </div>
                    <img
                        src={busStop.img}
                        alt={busStop.name}
                        style={{ width: "240px", borderRadius: "10px", marginTop: "10px" }}
                    />
                </Popup>
            </Marker>
        ))
    );
}