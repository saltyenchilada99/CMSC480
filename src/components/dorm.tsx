import { memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { GetDormIcon } from './busMarkers.tsx';
import { MarkerPopupCard } from './MarkerPopupCard.tsx';

type DormLocation = {
    name: string;
    lat: number;
    long: number;
    key: string;
    label: string;
    description: string;
    chips: string[];
    highlights: string[];
    link: string;
};

const dormLocations: DormLocation[] = [{
    name: "Columbia Hall",
    lat: 41.00802,
    long: 76.45013,
    key: 'D-1',
    label: 'Traditional Residence Hall',
    description: 'Columbia is a nine-story lower-campus hall with a busy lobby, study areas, and air-conditioned student rooms after recent upgrades.',
    chips: ['376 residents', '1970'],
    highlights: [
        'Two wings per floor with community assistants assigned by wing.',
        'Study rooms and offices are located in the lobby.',
        'Air conditioning was added to student rooms in 2017 and 2018.',
    ],
    link: 'https://www.commonwealthu.edu/campus-life/bloomsburg/housing/columbia-hall',
}, {
    name: "Northumberland Hall",
    lat: 41.00745,
    long: 76.44954,
    key: 'D-2',
    label: 'Traditional Residence Hall',
    description: 'Northumberland is one of Bloomsburg’s smaller residence halls, pairing updated lounges and bathrooms with a more close-knit feel.',
    chips: ['186 residents', '1960'],
    highlights: [
        'Renovations added ADA improvements, new lounge space, and updated bathrooms.',
        'Rooms are air conditioned and the building has an elevator.',
        'Creative Arts learning community options are available here.',
    ],
    link: 'https://www.commonwealthu.edu/campus-life/bloomsburg/documents/northumberland-hall-floor-plans',
}, {
    name: "Luzerne Hall",
    lat: 41.00697,
    long: 76.44920,
    key: 'D-3',
    label: 'Traditional Residence Hall',
    description: 'Luzerne balances classic residence hall living with a refreshed entrance, expanded lobby, and study/lounge space.',
    chips: ['290 residents', '1967'],
    highlights: [
        'A 2005 renovation refreshed the entrance and enlarged common spaces.',
        'Study lounges are available on each floor.',
        'Air-conditioned rooms and a required meal plan support first- and second-year living.',
    ],
    link: 'https://www.commonwealthu.edu/campus-life/bloomsburg/housing/luzerne-hall',
}, {
    name: "David L. Soltz Hall",
    lat: 41.00657,
    long: 76.44883,
    key: 'D-4',
    label: 'Suite-Style Residence Hall',
    description: 'Soltz is Bloomsburg’s modern suite-style hall, built around collaborative spaces, a rooftop terrace, and convenient food and retail on the first floor.',
    chips: ['394 residents', '2017'],
    highlights: [
        '135 suites house students in single, double, triple, and quad setups.',
        'The second floor includes collaborative learning space and a rooftop terrace.',
        'The University Store, Chick-fil-A, and QDOBA are on the first floor.',
    ],
    link: 'https://www.commonwealthu.edu/campus-life/bloomsburg/housing/soltz-hall',
}, {
    name: "Elwell Hall",
    lat: 41.00548,
    long: 76.44928,
    key: 'D-5',
    label: 'Traditional Residence Hall',
    description: 'Elwell is one of the largest halls on campus, known for its twin-wing layout, renovated lounges, and refreshed lobby and entrance.',
    chips: ['621 residents', '1968'],
    highlights: [
        'The 2013 renovation added new furniture, elevators, bathrooms, lounges, and study space.',
        'Individually controlled heating and air conditioning units were added to rooms.',
        'East and West wings help organize this large residence hall.',
    ],
    link: 'https://www.commonwealthu.edu/campus-life/bloomsburg/housing/elwell-hall',
}, {
    name: "Lycoming Hall",
    lat: 41.00616,
    long: 76.44935,
    key: 'D-6',
    label: 'Traditional Residence Hall',
    description: 'Lycoming combines everyday residence hall living with standout lounge space and recent honors-focused upgrades near the Eileen G. Jones Honors College.',
    chips: ['235 residents', '1976'],
    highlights: [
        'Ground-floor study lounges include one with a fireplace.',
        'A 2018 project added air conditioning and refreshed student spaces.',
        'Recent upgrades added a new honors college entrance, classrooms, and study areas.',
    ],
    link: 'https://www.commonwealthu.edu/campus-life/bloomsburg/housing/lycoming-hall',
}, {
    name: "Schuylkill Hall",
    lat: 41.00640,
    long: 76.45108,
    key: 'D-7',
    label: 'Traditional Residence Hall',
    description: 'Formerly known as West Hall, Schuylkill is a classic lower-campus option with built-in furniture, study lounges, and strong student support features.',
    chips: ['248 residents', '1964'],
    highlights: [
        'The Women\'s Resource Center is located in the building.',
        'Study lounges are available on each floor.',
        'Air-conditioned rooms and an elevator make it a practical lower-campus choice.',
    ],
    link: 'https://www.commonwealthu.edu/campus-life/bloomsburg/housing/schuylkill-hall',
}, {
    name: "Montgomery Place Apartments",
    lat: 41.01403,
    long: 76.44765,
    key: 'D-8',
    label: 'Apartment Complex',
    description: 'Montgomery Place offers upper-campus apartment living for students who want more independence while staying connected to campus via shuttle service.',
    chips: ['192 residents', '1989'],
    highlights: [
        'Two-bedroom, two-person apartments are grouped into six buildings.',
        'Dedicated parking and campus shuttle service support upper-campus living.',
        'Meal plans are optional and apartments include living-room furniture.',
    ],
    link: 'https://www.commonwealthu.edu/campus-life/bloomsburg/housing/montgomery-place-apartments',
}, {
    name: "Mount Olympus Apartments",
    lat: 41.01623,
    long: 76.44689,
    key: 'D-9',
    label: 'Apartment Complex',
    description: 'Mount Olympus is a townhouse-style apartment community designed for students who want single bedrooms and a more independent upper-campus setup.',
    chips: ['246 residents', '2001'],
    highlights: [
        'Ten buildings contain 41 townhouse-style apartments.',
        'Each apartment houses six students in single bedrooms.',
        'Residents get dedicated parking and shuttle access to lower campus.',
    ],
    link: 'https://www.commonwealthu.edu/campus-life/bloomsburg/housing/mount-olympus-apartments',
}, {
    name: "Jessica S. Kozloff Apartments",
    lat: 41.01764,
    long: 76.45336,
    key: 'D-10',
    label: 'Apartment Complex',
    description: 'JKA is a large upper-campus apartment complex with fully furnished units, a community building, and plenty of space for students who want apartment-style living.',
    chips: ['540 residents', '2009'],
    highlights: [
        'Apartments include single bedrooms, two bathrooms, and a kitchen.',
        'The community building includes a lounge, conference rooms, mailboxes, and a small fitness center.',
        'Parking is plentiful and shuttle service connects upper and lower campus.',
    ],
    link: 'https://www.commonwealthu.edu/campus-life/bloomsburg/housing/jessica-s-kozloff-apartments',
}];

export const Dorm = memo(function Dorm({ onMarkerFocus }: { onMarkerFocus?: (center: [number, number], type?: 'marker' | 'user', zoom?: number) => void }) {
    return (
        dormLocations.map((dorm: DormLocation) => {
            const position: [number, number] = [dorm.lat, -dorm.long];

            return (
            <Marker
                key={`${dorm.key}`}
                position={position}
                icon={GetDormIcon()}
                bubblingMouseEvents={false}
                zIndexOffset={500}
                eventHandlers={{
                    click: () => onMarkerFocus?.(position, 'marker'),
                }}
            >
                <Popup className="campus-popup campus-popup--housing" minWidth={260} maxWidth={312} autoPan={false}>
                    <MarkerPopupCard
                        theme="housing"
                        label={dorm.label}
                        title={dorm.name}
                        description={dorm.description}
                        chips={dorm.chips}
                        highlights={dorm.highlights}
                        link={dorm.link}
                        linkLabel="Housing details"
                    />
                </Popup>
            </Marker>
            );
        }));
});
