import { memo, useRef } from 'react';
import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import { GetAcademicIcon } from './busMarkers';
import { MarkerPopupCard } from './MarkerPopupCard';
import { useSelectedMarkerPopup } from './useSelectedMarkerPopup';
import type { MarkerFocusHandler, SelectedMarker } from '../types/frontend';

const minZoom : number = 17;

type AcademicBuilding = {
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

type AcademicProps = {
    onMarkerFocus?: MarkerFocusHandler;
    selectedMarker?: SelectedMarker;
    zoom: number;
};

export const academicBuildings: AcademicBuilding[] = [{
    name: "Arts & Administration Building",
    lat: 41.00827,
    long: 76.44522,
    key: 'A-1',
    label: 'Student Services + Arts',
    description: 'This lower-campus building combines student-facing offices with creative spaces, bringing together admissions, registrar services, and Visual Arts classrooms in one hub.',
    chips: ['Admissions', 'Visual Arts'],
    highlights: [
        'Undergraduate Admissions operates from Arts & Administration.',
        'Registrar services are based in the building.',
        'Visual Arts students use the building for art history and studio-centered study.',
    ],
    link: 'https://www.commonwealthu.edu/offices-directory/undergraduate-admissions-bloomsburg',
}, {
    name: "Harvey A. Andruss Library",
    lat: 41.00910,
    long: 76.44532,
    key: 'A-11',
    label: 'Library + Study Space',
    description: 'Andruss Library is Bloomsburg\'s main research and study library, combining quiet individual work areas with collaborative rooms, technology access, archives, and public-facing research support.',
    chips: ['900+ study spaces', 'Archives'],
    highlights: [
        'The library provides more than 900 study spaces and more than 200 computers across four floors.',
        'Nearly 30 group study rooms support collaborative work for small and mid-sized groups.',
        'University Archives and Special Collections are housed in Andruss alongside print, digital, and database access for research.',
    ],
    link: 'https://library.commonwealthu.edu/locations/andrusslibrary',
}, {
    name: "Centennial Hall",
    lat: 41.00800,
    long: 76.44606,
    key: 'A-2',
    label: 'Health and Clinic Space',
    description: 'Centennial Hall anchors allied health learning at Bloomsburg, supporting rehabilitation sciences programs and the public-facing Speech, Language, and Hearing Clinic.',
    chips: ['Rehab Sciences', 'Speech Clinic'],
    highlights: [
        'Rehabilitation Sciences programs are based here.',
        'The Speech, Language, and Hearing Clinic serves children and adults from the community.',
        'Students train in audiology, speech-language pathology, and related clinical disciplines.',
    ],
    link: 'https://www.commonwealthu.edu/offices-directory/speech-language-and-hearing-clinic',
}, {
    name: "Sutliff Hall",
    lat: 41.00773,
    long: 76.44681,
    key: 'A-3',
    label: 'Business and Sales',
    description: 'Sutliff Hall is a core Zeigler College of Business building where classroom learning connects with professional development in analytics, finance, marketing, and sales.',
    chips: ['Zeigler Business', 'Professional Sales'],
    highlights: [
        'Business, Innovation, and Technology is headquartered in Sutliff Hall.',
        'The Professional Sales Center gives students practical sales training.',
        'Career preparation and business skill-building are central to the building’s role.',
    ],
    link: 'https://www.commonwealthu.edu/offices-directory/business-innovation-and-technology',
}, {
    name: "Hartline Science Center",
    lat: 41.00731,
    long: 76.44768,
    key: 'A-4',
    label: 'Science Labs',
    description: 'Hartline is one of Bloomsburg’s major hands-on science buildings, supporting biology, health sciences, chemistry, physics, engineering, geography, and geology.',
    chips: ['Biology', 'Research'],
    highlights: [
        'Biological and Health Sciences operates from Hartline.',
        'Physical and Environmental Sciences uses large labs and research spaces here.',
        'CommonwealthU highlights Hartline as a state-of-the-art Bloomsburg science facility.',
    ],
    link: 'https://www.commonwealthu.edu/offices-directory/biological-and-health-sciences',
}, {
    name: "Ben Franklin Hall",
    lat: 41.00693,
    long: 76.44835,
    key: 'A-5',
    label: 'Cybersecurity and Tech',
    description: 'Ben Franklin Hall supports technology-focused learning and is home to the Center for Digital Forensics and Cybersecurity Studies.',
    chips: ['Forensics', 'Cybersecurity'],
    highlights: [
        'The center promotes research in information assurance, security, and digital forensics.',
        'Students use the building for applied, career-relevant technology study.',
        'Program resources are designed for both students and the wider community.',
    ],
    link: 'https://www.commonwealthu.edu/offices-directory/center-digital-forensics-and-cybersecurity-studies',
}, {
    name: "Navy Hall",
    lat: 41.00794,
    long: 76.44908,
    key: 'A-6',
    label: 'Education Programs',
    description: 'Navy Hall centers education-focused programs at Bloomsburg, especially teacher preparation, exceptionality studies, and student support initiatives tied to schools and communities.',
    chips: ['Teacher Prep', 'Community Work'],
    highlights: [
        'Early Childhood Education and Exceptionality Programs are based in Navy Hall.',
        'Programs emphasize classroom and field-based experiences with area schools and organizations.',
        'The McDowell Institute is also located in the building.',
    ],
    link: 'https://www.commonwealthu.edu/offices-directory/early-childhood-education-and-exceptionality-programs',
}, {
    name: "Haas Center for the Arts",
    lat: 41.00863,
    long: 76.44931,
    key: 'A-7',
    label: 'Performing Arts',
    description: 'Haas is Bloomsburg’s main performance and arts venue, pairing academic space with public concerts, productions, rehearsals, and exhibitions.',
    chips: ['Mitrani Hall', 'Gallery'],
    highlights: [
        'Home to Music, Theatre and Dance.',
        'Includes Mitrani Hall, the Haas Gallery of Art, and rehearsal/classroom space.',
        'Arts in Bloom programming also runs through Haas Center.',
    ],
    link: 'https://www.commonwealthu.edu/campus-life/bloomsburg/performing-arts-facilities',
}, {
    name: "Bakeless Center for Humanities",
    lat: 41.00830,
    long: 76.44824,
    key: 'A-8',
    label: 'Humanities and Writing',
    description: 'Bakeless supports language, literature, and writing study while also serving as an academic support spot for peer feedback and literacy coaching.',
    chips: ['Humanities', 'Writing Support'],
    highlights: [
        'Languages, Literatures, and Writing is based in Bakeless.',
        'WALES offers face-to-face writing support from the building.',
        'Students from every major can use Bakeless-based writing and reading help.',
    ],
    link: 'https://www.commonwealthu.edu/offices-directory/languages-literatures-and-writing',
}, {
    name: "McCormick Center",
    lat: 41.00874,
    long: 76.44745,
    key: 'A-9',
    label: 'Applied Learning',
    description: 'Recently reimagined, McCormick is designed as a workforce-readiness hub with updated teaching environments for health, media, education, and pre-law preparation.',
    chips: ['Simulation Labs', 'Career Ready'],
    highlights: [
        'The renovation added nursing simulation labs.',
        'Media and journalism spaces and early childhood education resources are part of the redesign.',
        'The building is intended to connect classroom work with professional practice.',
    ],
    link: 'https://www.commonwealthu.edu/news/mccormick-center-reimagined-hub-hands-learning-and-workforce-readiness',
}, {
    name: "Greenly Center",
    lat: 41.00342,
    long: 76.45531,
    key: 'A-10',
    label: 'Downtown Experience',
    description: 'Greenly Center extends the university into downtown Bloomsburg through gallery programming, professional experience opportunities, and continuing education activity.',
    chips: ['Gallery', 'Experience Lab'],
    highlights: [
        'The Gallery at Greenly Center showcases student, faculty, and regional artists.',
        'The site also houses corporate and continuing education activity.',
        'Living in Bloomsburg materials highlight Greenly as home to the Sekisui Professional Experience Lab.',
    ],
    link: 'https://www.commonwealthu.edu/offices-directory/arts-bloom/facilities/gallery-greenly-center',
}];

export const Academic = memo(function Academic({ onMarkerFocus, selectedMarker, zoom }: AcademicProps) {
    const academicIcon = GetAcademicIcon();

    if (zoom < minZoom) return null;

    return (
        <>
        {academicBuildings.map((academic: AcademicBuilding) => {
            const position: [number, number] = [academic.lat, -academic.long];

            return (
                <AcademicMarker
                    key={academic.key}
                    academic={academic}
                    icon={academicIcon}
                    onMarkerFocus={onMarkerFocus}
                    position={position}
                    selectedMarker={selectedMarker}
                />
            );
        })}
        </>
    );
});

type AcademicMarkerProps = {
    academic: AcademicBuilding;
    icon: L.Icon | L.DivIcon;
    onMarkerFocus?: MarkerFocusHandler;
    position: [number, number];
    selectedMarker?: SelectedMarker;
};

function AcademicMarker({
    academic,
    icon,
    onMarkerFocus,
    position,
    selectedMarker,
}: AcademicMarkerProps) {
    const markerRef = useRef<L.Marker | null>(null);

    useSelectedMarkerPopup({
        markerRef,
        markerKey: academic.key,
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
                click: () => onMarkerFocus?.(position, 'marker', undefined, academic.key),
            }}
        >
            <Popup className="campus-popup campus-popup--academic" minWidth={260} maxWidth={312} autoPan={false}>
                <MarkerPopupCard
                    theme="academic"
                    label={academic.label}
                    title={academic.name}
                    description={academic.description}
                    chips={academic.chips}
                    highlights={academic.highlights}
                    link={academic.link}
                    linkLabel="Official details"
                />
            </Popup>
        </Marker>
    );
}
