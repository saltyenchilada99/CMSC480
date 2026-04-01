import L from 'leaflet';
import busIcon from './bus_icon.png';
import busStop from './bus_stop_icon.png';
import academic from './academic_icon.png';
import dorm from './dorm_icon.png';

const MARKER_WIDTH = 108;
const MARKER_HEIGHT = 81;
// Hitbox is narrower than the visual so adjacent pins don't steal clicks.
const HIT_WIDTH = Math.round(MARKER_WIDTH * 0.39) - 2;
const HIT_HEIGHT = Math.max(28, Math.round(MARKER_HEIGHT * 0.66));
const TOP_HIT_EXTRA = 8;
function buildIcon(iconUrl: string) {
    const imgOffset = Math.round((MARKER_WIDTH - HIT_WIDTH) / 2);
    // Shift hitbox upward so the icon body is easier to click.
    const imgTopOffset = Math.round((MARKER_HEIGHT - HIT_HEIGHT) * 0.55);
    const anchorY = HIT_HEIGHT - 22;
    const popupOffsetY = -Math.round(MARKER_HEIGHT - anchorY - 16);
    return L.divIcon({
        className: 'marker-pin-icon',
        html: `<div style="width:${HIT_WIDTH}px;height:${HIT_HEIGHT + TOP_HIT_EXTRA}px;position:relative;overflow:visible;"><img src="${iconUrl}" draggable="false" style="width:${MARKER_WIDTH}px;height:${MARKER_HEIGHT}px;position:absolute;left:-${imgOffset}px;top:${TOP_HIT_EXTRA - imgTopOffset}px;pointer-events:none;"></div>`,
        iconSize: [HIT_WIDTH, HIT_HEIGHT + TOP_HIT_EXTRA],
        iconAnchor: [Math.round(HIT_WIDTH / 2), anchorY + TOP_HIT_EXTRA],
        popupAnchor: [0, popupOffsetY],
    });
}

export function GetBusIcon(icon:string) {
    const imgURL = icon === "busIcon" ? busIcon : busStop;
    return buildIcon(imgURL);
}

export function GetBusStopIcon() {
    return buildIcon(busStop);
}

export function GetAcademicIcon(icon:string) {
    return buildIcon(academic);
}

export function GetDormIcon(icon:string) {
    return buildIcon(dorm);
}
