import { Marker, Popup } from 'react-leaflet';
import { GetDormIcon } from './busMarkers.tsx';
class dorm {
    name!: string;
    lat!: number;
    long!: number;
    img!: string;
    key!: string;
}

const dormLibrary: dorm[] = [{
    name: "Columbia Hall",
    lat: 41.00802,
    long: 76.45013,
    img: '',
    key: 'D-1'
}, {
    name: "Northumberland Hall",
    lat: 41.00745,
    long: 76.44954,
    img: '',
    key: 'D-2'
}, {
    name: "Luzerne Hall",
    lat: 41.00697,
    long: 76.44920,
    img: '',
    key: 'D-3'
}, {
    name: "Hartline Center",
    lat: 41.00731,
    long: 76.44768,
    img: '',
    key: 'D-4'
}, {
    name: "Soltz Hall",
    lat: 41.00657,
    long: 76.44883,
    img: '',
    key: 'D-5'
}, {
    name: "Navy Hall",
    lat: 41.00794,
    long: 76.44908,
    img: '',
    key: 'D-6'
},
{
    name: "Elwell Hall",
    lat: 41.00548,
    long: 76.44928,
    img: '',
    key: 'D-7'
},
{
    name: "Lycoming Hall",
    lat: 41.00616,
    long: 76.44935,
    img: '',
    key: 'D-8'
},
{
    name: "Schykill Hall",
    lat: 41.00640,
    long: 76.45108,
    img: '',
    key: 'D-9'
},{
    name: "MPA Apartments",
    lat: 41.01403,
    long: 76.44765,
    img: '',
    key: 'D-10'
},{
    name: "MOA Apartments",
    lat: 41.01623,
    long: 76.44689,
    img: '',
    key: 'D-11'
},{
    name: "MOA Apartments",
    lat: 41.01623,
    long: 76.44689,
    img: '',
    key: 'D-11'
},{
    name: "JKA Apartments",
    lat: 41.01764,
    long: 76.45336,
    img: '',
    key: 'D-12'
}];

export function Dorm() {
    return (
        dormLibrary.map((dorm : dorm, i : number) => (
            <Marker
                key={`${dorm.key}`}
                position={[dorm.lat, -dorm.long]}
                icon={GetDormIcon("dormIcon")}
                zIndexOffset={500}
            >
                <Popup>
                    <strong>{dorm.name}</strong>
                </Popup>
            </Marker>
        )));
}