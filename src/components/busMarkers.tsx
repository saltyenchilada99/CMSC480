import L from 'leaflet';
import busIcon from './bus_icon.png';
import busIconNorth from './North_Bus.png';
import busIconSouth from './South_Bus.png';
import busIconEast from './East_Bus.png';
import busIconWest from './West Bus.png';
import busStop from './bus_stop_icon.png';
import academic from './academic_icon.png';
import dorm from './dorm_icon.png';
import userTrackerIcon from './user_tracker_icon.png';
import food from './food_icon.svg';
import recreation from './recreation_icon.svg';

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

const BUS_ICON = buildIcon(busIcon);
const BUS_ICON_NORTH = buildIcon(busIconNorth);
const BUS_ICON_SOUTH = buildIcon(busIconSouth);
const BUS_ICON_EAST = buildIcon(busIconEast);
const BUS_ICON_WEST = buildIcon(busIconWest);
const BUS_STOP_ICON = buildIcon(busStop);
const USER_ICON = buildIcon(userTrackerIcon);
const ACADEMIC_ICON = L.icon({
    iconUrl: academic,
    iconSize: [128, 95],
    iconAnchor: [64, 85],
});
const DORM_ICON = L.icon({
    iconUrl: dorm,
    iconSize: [128, 95],
    iconAnchor: [64, 85],
});
const FOOD_ICON = L.icon({
    iconUrl: food,
    iconSize: [64, 64],
    iconAnchor: [32, 58],
});
const RECREATION_ICON = L.icon({
    iconUrl: recreation,
    iconSize: [64, 64],
    iconAnchor: [32, 58],
});

export function GetBusIcon(icon: string) {
    if (icon === 'busIconNorth') return BUS_ICON_NORTH;
    if (icon === 'busIconSouth') return BUS_ICON_SOUTH;
    if (icon === 'busIconEast') return BUS_ICON_EAST;
    if (icon === 'busIconWest') return BUS_ICON_WEST;
    return icon === 'busIcon' ? BUS_ICON : BUS_STOP_ICON;
}

export function GetBusStopIcon() {
    return BUS_STOP_ICON;
}

export function GetAcademicIcon() {
    return ACADEMIC_ICON;
}

export function GetDormIcon() {
    return DORM_ICON;
}

export function GetFoodIcon() {
    return FOOD_ICON;
}

export function GetRecreationIcon() {
    return RECREATION_ICON;
}

export function GetUserIcon() {
    return USER_ICON;
}
