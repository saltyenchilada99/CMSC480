import L from 'leaflet';
import busIcon from './bus_icon.png';
import busStop from './bus_stop_icon.png';

export function GetBusIcon(icon) {
    const imgURL = icon === "busIcon" ? busIcon : busStop;
    return L.icon({
        iconUrl: imgURL,
        iconSize: [128, 95],
        iconAnchor: [64, 85],
    });
}
