import L from 'leaflet';
import busIcon from './bus_icon.png';
import busStop from './bus_stop_icon.png';
import academic from './academic_icon.png';
import dorm from './dorm_icon.png';
import food from './food_icon.svg';
import userTracker from './user_tracker_icon.png';

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
        html: '<div class="marker-pin-icon-wrapper" style="width:' + HIT_WIDTH + 'px;height:' + (HIT_HEIGHT + TOP_HIT_EXTRA) + 'px;"><img alt="" class="marker-pin-icon-img" src="' + iconUrl + '" draggable="false" style="width:' + MARKER_WIDTH + 'px;height:' + MARKER_HEIGHT + 'px;left:-' + imgOffset + 'px;top:' + (TOP_HIT_EXTRA - imgTopOffset) + 'px;"></div>',
        iconSize: [HIT_WIDTH, HIT_HEIGHT + TOP_HIT_EXTRA],
        iconAnchor: [Math.round(HIT_WIDTH / 2), anchorY + TOP_HIT_EXTRA],
        popupAnchor: [0, popupOffsetY],
    });
}

const BUS_ICON = buildIcon(busIcon);
const BUS_STOP_ICON = buildIcon(busStop);
const ACADEMIC_ICON = buildIcon(academic);
const DORM_ICON = buildIcon(dorm);

const FOOD_ICON = (() => {
    const hitW = Math.round(MARKER_WIDTH * 0.52);
    const hitH = Math.max(34, Math.round(MARKER_HEIGHT * 0.82));
    const imgOffset = Math.round((MARKER_WIDTH - hitW) / 2);
    const imgTopOffset = Math.round((MARKER_HEIGHT - hitH) * 0.55);
    const anchorY = hitH - 22;
    const popupOffsetY = -Math.round(MARKER_HEIGHT - anchorY - 16);
    return L.divIcon({
        className: 'marker-pin-icon',
        html: '<div class="marker-pin-icon-wrapper" style="width:' + hitW + 'px;height:' + (hitH + TOP_HIT_EXTRA) + 'px;"><img alt="" class="marker-pin-icon-img" src="' + food + '" draggable="false" style="width:' + MARKER_WIDTH + 'px;height:' + MARKER_HEIGHT + 'px;left:-' + imgOffset + 'px;top:' + (TOP_HIT_EXTRA - imgTopOffset) + 'px;"></div>',
        iconSize: [hitW, hitH + TOP_HIT_EXTRA],
        iconAnchor: [Math.round(hitW / 2), anchorY + TOP_HIT_EXTRA],
        popupAnchor: [0, popupOffsetY],
    });
})();

const USER_ICON = L.icon({
    iconUrl: userTracker,
    iconSize: [128, 95],
    iconAnchor: [64, 85],
});

export function GetBusIcon(icon: string) {
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

export function GetUserIcon(icon:string) {
    return USER_ICON;
}
