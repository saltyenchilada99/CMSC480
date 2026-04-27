import { memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { GetRecreationIcon } from './busMarkers.tsx';
import { MarkerPopupCard } from './MarkerPopupCard.tsx';

type RecreationLocation = {
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

export const recreationLocations: RecreationLocation[] = [{
    name: "Student Recreation Center",
    lat: 41.01097490879618,
    long: 76.4432801284402,
    key: 'R-1',
    label: 'Campus Recreation Hub',
    description: 'Bloomsburg\'s Student Recreation Center is the everyday fitness and wellness home base for students, bringing together workouts, group exercise, and casual competition in one lower-campus stop.',
    chips: ['Group Fitness', 'Intramurals'],
    highlights: [
        'Campus Recreation promotes group fitness, intramurals, club sports, and broader wellness programming for Bloomsburg students.',
        'The center includes a cardio/circuit room, weight room, climbing wall, dance studio, gymnasium courts, indoor track, boxing area, and racquetball courts.',
        'Membership access is built into student fees for actively enrolled on-campus students who are assessed the recreation fee.',
    ],
    link: 'https://www.commonwealthu.edu/offices-directory/campus-recreation/campus-recreation-centers',
}, {
    name: "Nelson Field House",
    lat: 41.015947864274736,
    long: 76.45051750435273,
    key: 'R-2',
    label: 'Indoor Competition Venue',
    description: 'Nelson Field House anchors Bloomsburg\'s indoor athletics on upper campus, supporting competition, training, events, and the related pool, wrestling, strength, nutrition, and student-athlete support spaces housed within the complex.',
    chips: ['Basketball', 'Swimming', 'Wrestling'],
    highlights: [
        'Bloomsburg Athletics describes Nelson as the home for the university\'s indoor athletic events, concerts, and some academic use.',
        'Major renovations added new bleachers, a new scoreboard, an expanded press box, a wrestling room, locker rooms, office space, and storage.',
    ],
    link: 'https://bloomsburgathletics.com/facilities/nelson-field-house/1',
}, {
    name: "Steph Pettit Stadium",
    lat: 41.016814931578274,
    long: 76.45073544855639,
    key: 'R-3',
    label: 'Field Sports Venue',
    description: 'Steph Pettit Stadium is Bloomsburg\'s showcase field-sports venue, giving the Huskies a dedicated home for fast-paced outdoor competition and major championship events.',
    chips: ['Soccer', 'Field Hockey'],
    highlights: [
        'The stadium is home to field hockey, men\'s and women\'s soccer, and women\'s lacrosse.',
        'Bloomsburg has used the venue for NCAA championship final-four events, and the field lighting was upgraded with LED light trees for the 2024 season.',
    ],
    link: 'https://bloomsburgathletics.com/facilities/steph-pettit-stadium/8',
}, {
    name: "Robert B. Redman Stadium",
    lat: 41.01726341018106,
    long: 76.44868809276883,
    key: 'R-4',
    label: 'Football + Track',
    description: 'Redman Stadium is the upper-campus home of Bloomsburg football and outdoor track and field, combining game-day atmosphere with full track-and-field competition infrastructure.',
    chips: ['Football', 'Track & Field'],
    highlights: [
        'The stadium seats 5,000 spectators and overlooks the Susquehanna Valley from the Pettit Athletic Complex.',
        'A major renovation added artificial turf, track and field facilities, lights, new visitor seating, ADA upgrades, and an updated press box.',
    ],
    link: 'https://bloomsburgathletics.com/facilities/danny-hale-field-at-redman-stadium/2',
}, {
    name: "Burt Reese Tennis Center",
    lat: 41.017627607773036,
    long: 76.45169419713041,
    key: 'R-5',
    label: 'Championship Tennis',
    description: 'Burt Reese Tennis Center gives Bloomsburg a full tennis venue on upper campus, supporting varsity matches, tournament hosting, and community-facing programming.',
    chips: ['13 Courts', 'USTA Hub'],
    highlights: [
        'The tennis center features 13 courts, lights, bleacher seating, and an observation deck.',
        'Bloomsburg received a 2024 USTA Collegiate Community Hub award to help expand tennis programs that are open to the public.',
    ],
    link: 'https://bloomsburgathletics.com/facilities/burt-reese-tennis-center/12',
}, {
    name: "Jan M. Hutchinson Field",
    lat: 41.01834491196298,
    long: 76.45016510636242,
    key: 'R-6',
    label: 'Softball Venue',
    description: 'Jan M. Hutchinson Field is Bloomsburg\'s softball home on upper campus, pairing a dedicated game venue with long-running program history tied to one of the most decorated coaches in college athletics.',
    chips: ['Softball', '1996'],
    highlights: [
        'The field opened in 1996 and offers bleacher seating behind home plate with additional viewing beyond the right-field fence.',
        'Bloomsburg Athletics notes that new windscreens were added in spring 2015 to refresh the facility.',
    ],
    link: 'https://bloomsburgathletics.com/facilities/jan-m-hutchinson-field/7',
}, {
    name: "Danny Litwhiler Field",
    lat: 41.01765528887251,
    long: 76.44729139965911,
    key: 'R-7',
    label: 'Baseball Venue',
    description: 'Danny Litwhiler Field is the Huskies\' baseball home on upper campus, combining a traditional ballpark layout with recent scoreboard and perimeter upgrades.',
    chips: ['Baseball', 'Scoreboard Upgrade'],
    highlights: [
        'Bloomsburg Athletics says the field has served as the Huskies\' baseball home since 1975, with bleacher seating behind home plate and hillside viewing beyond the outfield fence.',
        'The venue received a Daktronics scoreboard upgrade in fall 2021, and the scoreboard was formally named in summer 2024.',
    ],
    link: 'https://bloomsburgathletics.com/facilities/danny-litwhiler-field/6',
}];

export const Recreation = memo(function Recreation({ onMarkerFocus }: { onMarkerFocus?: (center: [number, number], type?: 'marker' | 'user', zoom?: number) => void }) {
    return (
        recreationLocations.map((location: RecreationLocation) => {
            const position: [number, number] = [location.lat, -location.long];

            return (
                <Marker
                    key={location.key}
                    position={position}
                    icon={GetRecreationIcon()}
                    bubblingMouseEvents={false}
                    zIndexOffset={500}
                    eventHandlers={{
                        click: () => onMarkerFocus?.(position, 'marker'),
                    }}
                >
                    <Popup className="campus-popup campus-popup--recreation" minWidth={260} maxWidth={312} autoPan={false}>
                        <MarkerPopupCard
                            theme="recreation"
                            label={location.label}
                            title={location.name}
                            description={location.description}
                            chips={location.chips}
                            highlights={location.highlights}
                            link={location.link}
                            linkLabel="Official details"
                        />
                    </Popup>
                </Marker>
            );
        })
    );
});
