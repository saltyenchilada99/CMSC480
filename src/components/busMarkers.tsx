/**
 * Leaflet icon factory for all custom map markers.
 *
 * The original image assets contain extra transparent space, so each marker is
 * wrapped in a `divIcon` with crop/anchor settings tuned for clickable Leaflet
 * placement and popup alignment.
 */

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
const DEFAULT_ANCHOR_Y = 63;
const BUS_ANCHOR_Y = 61;
const POPUP_BORDER_OFFSET = 10;

type MarkerCrop = {
    left: number;
    top: number;
    width: number;
    height: number;
};

const HIT_PADDING = 2;

/** Expand the clickable icon area slightly without changing the source asset. */
function withHitPadding(crop: MarkerCrop): MarkerCrop {
    return {
        left: Math.max(0, crop.left - HIT_PADDING),
        top: Math.max(0, crop.top - HIT_PADDING),
        width: Math.min(MARKER_WIDTH, crop.width + (HIT_PADDING * 2)),
        height: Math.min(MARKER_HEIGHT, crop.height + (HIT_PADDING * 2)),
    };
}

const CAMPUS_PLACE_CROP: MarkerCrop = withHitPadding({ left: 27, top: 9, width: 54, height: 60 });
const CAMPUS_PLACE_IMAGE_SCALE = 1.65;
const BUS_VERTICAL: MarkerCrop = withHitPadding({ left: 28, top: 6, width: 90, height: 105 });
const BUS_HORIZONTAL: MarkerCrop = withHitPadding({ left: 28, top: 6, width: 135, height: 135 });
const BUS_STOP_CROP: MarkerCrop = withHitPadding({ left: 31, top: 4, width: 146, height: 170 });
const BUS_CROP: MarkerCrop = withHitPadding({ left: 26, top: 5, width: 58, height: 67 });

function toInlineStyle(styles: Record<string, string>): string {
    return Object.entries(styles)
        .map(([property, value]) => `${property}:${value}`)
        .join(';');
}

function buildIcon(
    iconUrl: string,
    crop: MarkerCrop,
    anchorY = DEFAULT_ANCHOR_Y,
    busVertical = false,
    imageScale = 1
) {
    const iconAnchorY = anchorY - crop.top;
    const popupOffsetY = -iconAnchorY + POPUP_BORDER_OFFSET;
    const adjustedAnchorY = busVertical ? iconAnchorY : crop.height * 0.75;
    const imageOffset = (imageScale - 1) * -50;
    const imageSize = imageScale * 100;
    const wrapperStyle = toInlineStyle({
        width: `${crop.width}px`,
        height: `${crop.height}px`,
    });
    const imageStyle = toInlineStyle({
        width: `${imageSize}%`,
        height: `${imageSize}%`,
        left: `${imageOffset}%`,
        top: `${imageOffset}%`,
        'object-fit': 'contain',
    });

    return L.divIcon({
        className: 'marker-pin-icon',
        html: [
            `<div class="marker-pin-icon-wrapper" style="${wrapperStyle}">`,
            `<img class="marker-pin-icon-img" src="${iconUrl}" alt="" draggable="false" style="${imageStyle}">`,
            '</div>',
        ].join(''),
        iconSize: [crop.width, crop.height],
        iconAnchor: [crop.width / 2, adjustedAnchorY],
        popupAnchor: [0, popupOffsetY],
    });
}

const BUS_ICON = buildIcon(busIcon, BUS_CROP, BUS_ANCHOR_Y);
const BUS_ICON_NORTH = buildIcon(busIconNorth, BUS_VERTICAL, BUS_ANCHOR_Y, false);
const BUS_ICON_SOUTH = buildIcon(busIconSouth, BUS_VERTICAL, BUS_ANCHOR_Y, false);
const BUS_ICON_EAST = buildIcon(busIconEast, BUS_HORIZONTAL, BUS_ANCHOR_Y, true);
const BUS_ICON_WEST = buildIcon(busIconWest, BUS_HORIZONTAL, BUS_ANCHOR_Y, true);
const BUS_STOP_ICON = buildIcon(busStop, BUS_STOP_CROP);
const ACADEMIC_ICON = buildIcon(academic, CAMPUS_PLACE_CROP, DEFAULT_ANCHOR_Y, false, CAMPUS_PLACE_IMAGE_SCALE);
const DORM_ICON = buildIcon(dorm, CAMPUS_PLACE_CROP, DEFAULT_ANCHOR_Y, false, CAMPUS_PLACE_IMAGE_SCALE);
const FOOD_ICON = buildIcon(food, CAMPUS_PLACE_CROP, DEFAULT_ANCHOR_Y, false, CAMPUS_PLACE_IMAGE_SCALE);
const RECREATION_ICON = buildIcon(recreation, CAMPUS_PLACE_CROP, DEFAULT_ANCHOR_Y, false, CAMPUS_PLACE_IMAGE_SCALE);
const USER_ICON = L.icon({
    iconUrl: userTrackerIcon,
    iconSize: [128, 95],
    iconAnchor: [64, 85],
});

/** Return a cached bus icon variant by the historical string key. */
export function GetBusIcon(icon: string) {
    if (icon === 'busIconNorth') return BUS_ICON_NORTH;
    if (icon === 'busIconSouth') return BUS_ICON_SOUTH;
    if (icon === 'busIconEast') return BUS_ICON_EAST;
    if (icon === 'busIconWest') return BUS_ICON_WEST;
    return icon === 'busIcon' ? BUS_ICON : BUS_ICON_WEST;
}

/** Bus stop marker icon. */
export function GetBusStopIcon() {
    return BUS_STOP_ICON;
}

/** Academic building marker icon. */
export function GetAcademicIcon() {
    return ACADEMIC_ICON;
}

/** Residence hall marker icon. */
export function GetDormIcon() {
    return DORM_ICON;
}

/** Dining marker icon. */
export function GetFoodIcon() {
    return FOOD_ICON;
}

/** Recreation and athletics marker icon. */
export function GetRecreationIcon() {
    return RECREATION_ICON;
}

/** Browser geolocation marker icon. */
export function GetUserIcon(_icon?: string) {
    return USER_ICON;
}
