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

const recreationLocations: RecreationLocation[] = [{
    name: "Student Recreation Center",
    lat: 41.00819,
    long: 76.44386,
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
    lat: 41.01525,
    long: 76.44961,
    key: 'R-2',
    label: 'Indoor Competition Venue',
    description: 'Nelson Field House anchors Bloomsburg\'s indoor athletics on upper campus, supporting competition, training, events, and a pool complex within the Pettit Athletic Complex.',
    chips: ['Basketball', 'Swimming'],
    highlights: [
        'Bloomsburg Athletics describes Nelson as the home for the university\'s indoor athletic events, concerts, and some academic use.',
        'Major renovations added new bleachers, a new scoreboard, an expanded press box, a wrestling room, locker rooms, office space, and storage.',
    ],
    link: 'https://bloomsburgathletics.com/facilities/nelson-field-house/1',
}, {
    name: "Steph Pettit Stadium",
    lat: 41.01616,
    long: 76.44848,
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
    name: "Danny Hale Field at Redman Stadium",
    lat: 41.01542,
    long: 76.44748,
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
    lat: 41.01698,
    long: 76.44781,
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
    lat: 41.01693,
    long: 76.44690,
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
    lat: 41.01578,
    long: 76.44635,
    key: 'R-7',
    label: 'Baseball Venue',
    description: 'Danny Litwhiler Field is the Huskies\' baseball home on upper campus, combining a traditional ballpark layout with recent scoreboard and perimeter upgrades.',
    chips: ['Baseball', 'Scoreboard Upgrade'],
    highlights: [
        'Bloomsburg Athletics says the field has served as the Huskies\' baseball home since 1975, with bleacher seating behind home plate and hillside viewing beyond the outfield fence.',
        'The venue received a Daktronics scoreboard upgrade in fall 2021, and the scoreboard was formally named in summer 2024.',
    ],
    link: 'https://bloomsburgathletics.com/facilities/danny-litwhiler-field/6',
}, {
    name: "Nelson Field House Pool",
    lat: 41.01549,
    long: 76.44942,
    key: 'R-8',
    label: 'Aquatics Facility',
    description: 'The Nelson Field House Pool gives Bloomsburg a dedicated aquatics competition space inside the upper-campus field house complex.',
    chips: ['Swimming', 'Water Polo'],
    highlights: [
        'Built in 1972 and renovated in 2010, the pool features six competition-length lanes and an automatic Colorado Timing System.',
        'Bleacher seating for nearly 800 spectators supports varsity swimming, club water polo, and district championship meets.',
    ],
    link: 'https://bloomsburgathletics.com/facilities/nelson-field-house-pool/11',
}, {
    name: "Wrestling Room",
    lat: 41.01523,
    long: 76.44994,
    key: 'R-9',
    label: 'Training + Locker Space',
    description: 'Bloomsburg\'s wrestling room is the dedicated practice and team-support space for the university\'s Division I wrestling program inside Nelson Field House.',
    chips: ['DI Wrestling', 'Locker Room'],
    highlights: [
        'The room serves as the program\'s main training and locker room facility.',
        'Bloomsburg Athletics says wrestlers have access to cardio and weight-training equipment in the space.',
    ],
    link: 'https://bloomsburgathletics.com/facilities/wrestling-room/44',
}, {
    name: "Sharon Gettel Student-Athlete Lounge",
    lat: 41.01562,
    long: 76.44974,
    key: 'R-10',
    label: 'Academic Support Space',
    description: 'The Sharon Gettel Student-Athlete Lounge adds a focused academic and study environment for Huskies inside Nelson Field House.',
    chips: ['Study Lounge', 'Athlete Support'],
    highlights: [
        'The lounge was endowed by former student-athlete and longtime supporter Sharon Gettel.',
        'Official details highlight computers, a group workspace, and individual study areas.',
    ],
    link: 'https://bloomsburgathletics.com/facilities/sharon-gettel-student-athlete-lounge/39',
}, {
    name: "Tyler Horst Nutritional Center",
    lat: 41.01502,
    long: 76.44946,
    key: 'R-11',
    label: 'Performance Nutrition',
    description: 'The Tyler Horst Nutritional Center gives Bloomsburg student-athletes a dedicated recovery-fuel stop inside Nelson Field House.',
    chips: ['Nutrition', 'Recovery Support'],
    highlights: [
        'The center was established in fall 2022 in memory of Tyler Horst to serve all Bloomsburg student-athletes.',
        'Bloomsburg Athletics says it provides healthy food and beverage snack options for pre- and post-practice activity.',
    ],
    link: 'https://bloomsburgathletics.com/facilities/tyler-horst-nutritional-center/37',
}, {
    name: "Weight Room",
    lat: 41.01514,
    long: 76.44918,
    key: 'R-12',
    label: 'Strength and Conditioning',
    description: 'The Bloomsburg athletics weight room is the primary strength-and-conditioning space reserved for varsity student-athletes inside Nelson Field House.',
    chips: ['Strength', 'Student-Athletes'],
    highlights: [
        'The weight room was renovated as part of the Nelson Field House renovation project in 2009.',
        'Only Bloomsburg student-athletes have access for preseason, in-season, and postseason training with the strength staff.',
    ],
    link: 'https://bloomsburgathletics.com/facilities/weight-room/41',
}, {
    name: "Sully & Bubs Pavilion",
    lat: 41.01486,
    long: 76.44858,
    key: 'R-13',
    label: 'Named Pavilion Space',
    description: 'Sully & Bubs Pavilion is a donor-named pavilion in the Pettit Athletic Complex recognized in Bloomsburg\'s upper-campus dedication coverage.',
    chips: ['Pettit Athletic Complex', 'Pavilion'],
    highlights: [
        'Bloomsburg Athletics lists Sully & Bubs Pavilion among the official Pettit Athletic Complex facilities.',
        'Commonwealth University\'s upper-campus naming coverage says Steph Pettit honored classmates through the Sully & Bubs Pavilion.',
    ],
    link: 'https://www.commonwealthu.edu/news/steph-pettit-89-honored-renaming-upper-campus',
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
