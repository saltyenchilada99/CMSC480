import { memo } from 'react';
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
    'BS-8': [ROUTES.walmart],
    'BS-9': [ROUTES.downtown],
    'BS-10': [ROUTES.downtown],
    'BS-11': [ROUTES.downtown],
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

export const busStopLibrary: busStop[] = [{
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
    name: "GAA",
    lat: 41.00688,
    long: 76.45747,
    desc: 'A fine choice for off-campus Housing, the Glenn Avenue Apartments offers luxury housing for ' +
        'students as well as modern amenities.',
    location: 'Located on the Corner of Glenn Ave & Iron ST',
    img: '/busStopImages/warhurst_apartments.png',
    key: 'BS-7'
}, {
    name: "Walmart",
    lat: 41.00872,
    long: 76.48541,
    desc: 'The Walmart Supercenter acts as a direct link for students to perform shopping for any ' +
        'luxuries required to get through the day-by-day living at Bloomsburg University.',
    location: 'Located at Buckhorn Plaza, 48 Plaza DR',
    img: '/busStopImages/bloomsburg_walmart.png',
    key: 'BS-8'
}, {
    name: "McCormick Center",
    lat: 41.00880,
    long: 76.44723,
    desc: 'The McCormick Center for the bus service is the gateway to Downtown Bloomsburg, ' +
        'providing a direct link to the shopping centers and living quarters.',
    location: 'Located at 400 E Second ST',
    img: '/busStopImages/mccormick_center.png',
    key: 'BS-9'
}, {
    name: "Fountain",
    lat: 41.00268,
    long: 76.45811,
    desc: 'The David Stroup Fountain, made in 1892, acts as a central Downtown stop for commuting ' +
        'between the University and any other living quarters not directly linked to Bloomsburg University.',
    location: 'Located at 157-199 Market ST',
    img: '/busStopImages/david_stroup_fountain.png',
    key: 'BS-10'
}, {
    name: "OSHA",
    lat: 41.00422,
    long: 76.45687,
    desc: 'The Housing of Choice, the Old School House Apartment Complex provides students and teaching ' +
        'staff alike the best choice for housing, while being comfortably situated between the neighboring shops.',
    location: 'Located on 50 E 1st ST',
    img: '/busStopImages/old_school_house_apartments.png',
    key: 'BS-11'
}];

export const BusStop = memo(function BusStop({ onMarkerFocus }: { onMarkerFocus?: (center: [number, number], type?: 'marker' | 'user', zoom?: number) => void }) {
    return (
        busStopLibrary.map((busStopItem : busStop) => {
            const position: [number, number] = [busStopItem.lat, -busStopItem.long];

            return (
                <Marker
                    key={`${busStopItem.key}`}
                    position={position}
                    icon={GetBusStopIcon()}
                    bubblingMouseEvents={false}
                    zIndexOffset={500}
                    eventHandlers={{
                        click: () => onMarkerFocus?.(position, 'marker'),
                    }}
                >
                    <Popup className="campus-popup campus-popup--transit" minWidth={252} maxWidth={312} autoPan={false}>
                        <div className="info-popup-card info-popup-card--transit">
                            <span className="info-popup-card__eyebrow">Transit stop</span>
                            <h3 className="info-popup-card__title">{busStopItem.name}</h3>
                            <p className="info-popup-card__text">{busStopItem.desc}</p>
                            <p className="info-popup-card__supporting">{busStopItem.location}</p>
                            <div className="info-popup-card__section-label">Routes</div>
                            <div className="info-popup-card__chips">
                                {(STOP_ROUTES[busStopItem.key] ?? []).map((route) => (
                                    <span
                                        key={route.name}
                                        className="info-popup-card__chip"
                                        style={{ backgroundColor: route.color, color: '#fff' }}
                                    >
                                        {route.name}
                                    </span>
                                ))}
                            </div>
                            <img
                                src={busStopItem.img}
                                alt={busStopItem.name}
                                className="info-popup-card__image"
                                decoding="async"
                                loading="lazy"
                            />
                        </div>
                    </Popup>
                </Marker>
            );
        })
    );
});
