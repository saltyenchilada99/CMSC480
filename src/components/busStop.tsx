import { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { GetBusIcon } from './busMarkers.tsx';
class busStop {
    name!: string;
    lat!: number;
    long!: number;
    img!: string;
    key!: string;
}

const busStopLibrary: busStop[] = [{
    name: "library",
    lat: 41.00865,
    long: 76.44525,
    img: '',
    key: 'BS-1'
}, {
    name: "MPA",
    lat: 41.01429,
    long: 76.44654,
    img: '',
    key: 'BS-2'
}, {
    name: "Athletic Complex",
    lat: 41.01525,
    long: 76.44961,
    img: '',
    key: 'BS-3'
}, {
    name: "JKA",
    lat: 41.01735,
    long: 76.45308,
    img: '',
    key: 'BS-4'
}, {
    name: "Orange Lot",
    lat: 41.01820,
    long: 76.448865,
    img: '',
    key: 'BS-5'
}, {
    name: "MOA",
    lat: 41.01635,
    long: 76.44624,
    img: '',
    key: 'BS-6'
}];

export function BusStop() {
    return (
        busStopLibrary.map((busStop : busStop, i : number) => (
            <Marker key= { `${busStop.key}` } position = { [busStop.lat, -busStop.long]} icon={GetBusIcon("busStopIcon")}>
            <Popup>
            <strong>{ busStop.name } </strong>
            </Popup>
            </Marker>
        )));
}