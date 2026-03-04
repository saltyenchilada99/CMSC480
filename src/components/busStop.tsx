import { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
class busStop {
    name!: string;
    lat!: number;
    long!: number;
    img!: string;
}

const busStopLibrary: busStop[] = [{
    name: "library",
    lat: 41.00870,
    long: 76.44525,
    img: ''
}, {
    name: "MPA",
    lat: 41.01434,
    long: 76.44654,
    img: ''
}, {
    name: "Athletic Complex",
    lat: 41.01530,
    long: 76.44961,
    img: ''
}, {
    name: "JKA",
    lat: 41.01740,
    long: 76.45308,
    img: ''
}, {
    name: "Orange Lot",
    lat: 41.01751,
    long: 76.45038,
    img: ''
}, {
    name: "MOA",
    lat: 41.01640,
    long: 76.44624,
    img: ''
}];

export function BusStop( {toggleStops}: {toggleStops : boolean}) {
    console.log(toggleStops);
    return (
        toggleStops && busStopLibrary.map((busStop : busStop, i : number) => (
            <Marker key= { `${i}` } position = { [busStop.lat, -busStop.long]} >
            <Popup>
            <strong>{ busStop.name } </strong>
            </Popup>
            </Marker>
        )));
}