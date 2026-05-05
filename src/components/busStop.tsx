import { memo, useRef } from 'react';
import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import { GetBusStopIcon } from './busMarkers';
import { useSelectedMarkerPopup } from './useSelectedMarkerPopup';
import type { MarkerFocusHandler, SelectedMarker } from '../types/frontend';

type RouteInfo = {
    name: string;
    color: string;
};

type BusStopLocation = {
    name: string;
    lat: number;
    long: number;
    desc: string;
    location: string;
    img: string;
    key: string;
};

type BusStopProps = {
    onMarkerFocus?: MarkerFocusHandler;
    selectedMarker?: SelectedMarker;
    zoom?: number;
};

const ROUTES: Record<string, RouteInfo> = {
    campus: { name: 'Campus Loop', color: '#B8860B' },
    downtown: { name: 'Downtown Loop', color: '#6D0026' },
    walmart: { name: 'Walmart Trip', color: '#0057B8' },
};

const minZoom = 15;

const STOP_ROUTES: Record<string, RouteInfo[]> = {
    'BS-1': [ROUTES.campus, ROUTES.walmart],
    'BS-2': [ROUTES.campus],
    'BS-3': [ROUTES.campus],
    'BS-4': [ROUTES.campus],
    'BS-5': [ROUTES.campus],
    'BS-6': [ROUTES.campus],
    'BS-7': [ROUTES.downtown],
    'BS-8': [ROUTES.walmart],
    'BS-9': [ROUTES.downtown],
    'BS-10': [ROUTES.downtown],
    'BS-11': [ROUTES.downtown],
};

export const busStopLibrary: BusStopLocation[] = [{
    name: 'Library, A&A Building',
    lat: 41.00865,
    long: 76.44525,
    desc: 'A shared stop between the Library and the Arts & Administration Building.',
    location: 'Located on the corner of Swisher DR and Chestnut ST',
    img: '/busStopImages/library_and_aa_building.png',
    key: 'BS-1',
}, {
    name: 'MPA',
    lat: 41.01429,
    long: 76.44654,
    desc: 'One of the earliest apartment stops near the Athletic Complex, the Montgomery Plaza Apartment Complex works as good in-between housing for sports and studying on campus.',
    location: 'Located on Welsh Circle toward the Athletic Complex',
    img: '/busStopImages/montgomery_plaza_apartments.png',
    key: 'BS-2',
}, {
    name: 'Nelson Field House',
    lat: 41.01525,
    long: 76.44961,
    desc: 'This stop is the earliest stop in the Athletic Complex and acts as a direct link for the Nelson Field House to the northwest.',
    location: 'Located on the south end of Welsh Circle',
    img: '/busStopImages/nelson_field_house.png',
    key: 'BS-3',
}, {
    name: 'JKA',
    lat: 41.01735,
    long: 76.45308,
    desc: 'This stop serves the Jessica Kozloff Apartment Complex and is the closest housing stop to the Athletic Complex.',
    location: 'Located on Kozloff Drive',
    img: '/busStopImages/jessica_kozlof_apartments.png',
    key: 'BS-4',
}, {
    name: 'Orange Lot',
    lat: 41.01820,
    long: 76.448865,
    desc: 'One of the only parking lots not requiring tags or tickets, sitting between the courts of the Athletic Complex.',
    location: 'Located on the north end of Welsh Circle',
    img: '/busStopImages/orange_lot.png',
    key: 'BS-5',
}, {
    name: 'MOA',
    lat: 41.01635,
    long: 76.44624,
    desc: 'A good substitute to JKA, the Mount Olympus Apartment Complex adds extra living space near the Athletic Complex.',
    location: 'Located on Stuart Edwards DR just off Welsh Circle',
    img: '/busStopImages/mount_olympus_apartments.png',
    key: 'BS-6',
}, {
    name: 'GAA',
    lat: 41.00688,
    long: 76.45747,
    desc: 'A choice for off-campus housing, Glenn Avenue Apartments offers student housing and modern amenities.',
    location: 'Located on the corner of Glenn Ave and Iron ST',
    img: '/busStopImages/warhurst_apartments.png',
    key: 'BS-7',
}, {
    name: 'Walmart',
    lat: 41.00872,
    long: 76.48541,
    desc: 'The Walmart Supercenter gives students a direct link for shopping and day-to-day needs.',
    location: 'Located at Buckhorn Plaza, 48 Plaza DR',
    img: '/busStopImages/bloomsburg_walmart.png',
    key: 'BS-8',
}, {
    name: 'McCormick Center',
    lat: 41.00880,
    long: 76.44723,
    desc: 'McCormick Center is the gateway to Downtown Bloomsburg bus service, connecting campus with shopping centers and living quarters.',
    location: 'Located at 400 E Second ST',
    img: '/busStopImages/mccormick_center.png',
    key: 'BS-9',
}, {
    name: 'Fountain',
    lat: 41.00268,
    long: 76.45811,
    desc: 'The David Stroup Fountain acts as a central downtown stop for commuting between the university and nearby living quarters.',
    location: 'Located at 157-199 Market ST',
    img: '/busStopImages/david_stroup_fountain.png',
    key: 'BS-10',
}, {
    name: 'OSHA',
    lat: 41.00422,
    long: 76.45687,
    desc: 'The Old School House Apartment Complex provides student and staff housing near neighboring shops.',
    location: 'Located on 50 E 1st ST',
    img: '/busStopImages/old_school_house_apartments.png',
    key: 'BS-11',
}];

export const BusStop = memo(function BusStop({ onMarkerFocus, selectedMarker, zoom = minZoom }: BusStopProps) {
    const busStopIcon = GetBusStopIcon();

    return (
        <>
            {busStopLibrary
                .filter(() => zoom >= minZoom)
                .map((busStopItem) => {
                    const position: [number, number] = [busStopItem.lat, -busStopItem.long];

                    return (
                        <BusStopMarker
                            key={busStopItem.key}
                            busStopItem={busStopItem}
                            icon={busStopIcon}
                            onMarkerFocus={onMarkerFocus}
                            position={position}
                            selectedMarker={selectedMarker}
                        />
                    );
                })}
        </>
    );
});

type BusStopMarkerProps = {
    busStopItem: BusStopLocation;
    icon: L.Icon | L.DivIcon;
    onMarkerFocus?: MarkerFocusHandler;
    position: [number, number];
    selectedMarker?: SelectedMarker;
};

function BusStopMarker({
    busStopItem,
    icon,
    onMarkerFocus,
    position,
    selectedMarker,
}: BusStopMarkerProps) {
    const markerRef = useRef<L.Marker | null>(null);

    useSelectedMarkerPopup({
        markerRef,
        markerKey: busStopItem.key,
        markerPosition: position,
        selectedMarkerKey: selectedMarker?.key,
        selectedMarkerRequestId: selectedMarker?.requestId,
        selectedMarkerZoom: selectedMarker?.zoom,
    });

    return (
        <Marker
            ref={markerRef}
            position={position}
            icon={icon}
            bubblingMouseEvents={false}
            zIndexOffset={500}
            eventHandlers={{
                click: () => onMarkerFocus?.(position, 'marker', undefined, busStopItem.key),
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
}
