import L from 'leaflet';
import busIcon from './bus_icon.png';
import busStop from './bus_stop_icon.png';
import academic from './academic_icon.png';
import dorm from './dorm_icon.png';

export function GetBusIcon(icon:string) {
    const imgURL = icon === "busIcon" ? busIcon : busStop;
    return L.icon({
        iconUrl: imgURL,
        iconSize: [128, 95],
        iconAnchor: [64, 85],
    });
}

export function GetColoredBusStopIcon(_colors: string[], busStopImgUrl: string) {
    return L.icon({
        iconUrl: busStopImgUrl,
        iconSize: [128, 95],
        iconAnchor: [64, 85],
        popupAnchor: [0, -85],
    });
}

export function GetAcademicIcon(_icon:string) {
    return L.icon({
        iconUrl: academic,
        iconSize: [128, 95],
        iconAnchor: [64, 85],
    });
}

export function GetDormIcon(_icon:string) {
    return L.icon({
        iconUrl: dorm,
        iconSize: [128, 95],
        iconAnchor: [64, 85],
    });
}
