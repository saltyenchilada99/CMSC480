import { Marker, Popup } from 'react-leaflet';
import { GetAcademicIcon } from './busMarkers.tsx';
class academic {
    name!: string;
    lat!: number;
    long!: number;
    img!: string;
    key!: string;
}

const academicLibrary: academic[] = [{
    name: "Arts and Administration",
    lat: 41.00827,
    long: 76.44522,
    img: '',
    key: 'A-1'
}, {
    name: "Centennial Hall",
    lat: 41.00800,
    long: 76.44606,
    img: '',
    key: 'A-2'
}, {
    name: "Sutliff Hall",
    lat: 41.00773,
    long: 76.44681,
    img: '',
    key: 'A-3'
}, {
    name: "Hartline Center",
    lat: 41.00731,
    long: 76.44768,
    img: '',
    key: 'A-4'
}, {
    name: "Ben Franklin Hall",
    lat: 41.00693,
    long: 76.44835,
    img: '',
    key: 'A-5'
}, {
    name: "Navy Hall",
    lat: 41.00794,
    long: 76.44908,
    img: '',
    key: 'A-6'
},
{
    name: "Haas Center of the Arts",
    lat: 41.00863,
    long: 76.44931,
    img: '',
    key: 'A-7'
},
{
    name: "Bakeless Center",
    lat: 41.00830,
    long: 76.44824,
    img: '',
    key: 'A-8'
},
{
    name: "McCormick Hall",
    lat: 41.00874,
    long: 76.44745,
    img: '',
    key: 'A-9'
},{
    name: "Greenly Center",
    lat: 41.00342,
    long: 76.45531,
    img: '',
    key: 'A-10'
}];

export function Academic() {
    return (
        academicLibrary.map((academic : academic, i : number) => (
            <Marker
                key={`${academic.key}`}
                position={[academic.lat, -academic.long]}
                icon={GetAcademicIcon("academicIcon")}
                zIndexOffset={500}
            >
                <Popup>
                    <strong>{academic.name}</strong>
                </Popup>
            </Marker>
        )));
}