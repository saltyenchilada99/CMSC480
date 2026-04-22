import L from 'leaflet';
// Every image import gives error even though they are extracted successfully.
import busIconNorth from './North_Bus.png';
import busIconSouth from './South_Bus.png';
import busIconEast from './East_Bus.png';
import busIconWest from './West Bus.png';
import busStop from './bus_stop_icon.png';
import academic from './academic_icon.png';
import dorm from './dorm_icon.png';
import food from './food_icon.svg';
import recreation from './recreation_icon.svg';
import userTracker from './user_tracker_icon.png';

const MARKER_WIDTH = 108;
const MARKER_HEIGHT = 81;
const MARKER_CENTER_X = Math.round(MARKER_WIDTH / 2);
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

function withHitPadding(crop: MarkerCrop): MarkerCrop {
    return {
        left: Math.max(0, crop.left - HIT_PADDING),
        top: Math.max(0, crop.top - HIT_PADDING),
        width: Math.min(MARKER_WIDTH, crop.width + (HIT_PADDING * 2)),
        height: Math.min(MARKER_HEIGHT, crop.height + (HIT_PADDING * 2)),
    };
}

const ACADEMIC_CROP: MarkerCrop = withHitPadding({ left: 28, top: 6, width: 52, height: 68 });
const DORM_CROP: MarkerCrop = withHitPadding({ left: 30, top: 5, width: 50, height: 68 });
const BUS_STOP_CROP: MarkerCrop = withHitPadding({ left: 31, top: 4, width: 46, height: 70 });
const BUS_CROP: MarkerCrop = withHitPadding({ left: 26, top: 5, width: 58, height: 67 });
const FOOD_CROP: MarkerCrop = withHitPadding({ left: 27, top: 9, width: 54, height: 60 });
const RECREATION_CROP: MarkerCrop = withHitPadding({ left: 27, top: 9, width: 54, height: 60 });

function buildIcon(
    iconUrl: string,
    crop: MarkerCrop,
    anchorY = DEFAULT_ANCHOR_Y
) {
    const iconAnchorY = anchorY - crop.top;
    const popupOffsetY = -iconAnchorY + POPUP_BORDER_OFFSET;

    return L.divIcon({
        className: 'marker-pin-icon',
        html: '<div class="marker-pin-icon-wrapper" style="width:' + crop.width + 'px;height:' + crop.height + 'px;"><img alt="" class="marker-pin-icon-img" src="' + iconUrl + '" draggable="false" style="width:' + MARKER_WIDTH + 'px;height:' + MARKER_HEIGHT + 'px;left:-' + crop.left + 'px;top:-' + crop.top + 'px;"></div>',
        iconSize: [crop.width, crop.height],
        iconAnchor: [MARKER_CENTER_X - crop.left, iconAnchorY],
        popupAnchor: [0, popupOffsetY],
    });
}

const BUS_ICON_NORTH = buildIcon(busIconNorth, BUS_CROP, BUS_ANCHOR_Y);
const BUS_ICON_SOUTH = buildIcon(busIconSouth, BUS_CROP, BUS_ANCHOR_Y);
const BUS_ICON_EAST = buildIcon(busIconEast, BUS_CROP, BUS_ANCHOR_Y);
const BUS_ICON_WEST = buildIcon(busIconWest, BUS_CROP, BUS_ANCHOR_Y);
const BUS_STOP_ICON = buildIcon(busStop, BUS_STOP_CROP);
const ACADEMIC_ICON = buildIcon(academic, ACADEMIC_CROP);
const DORM_ICON = buildIcon(dorm, DORM_CROP);
const FOOD_ICON = buildIcon(food, FOOD_CROP, DEFAULT_ANCHOR_Y);
const RECREATION_ICON = buildIcon(recreation, RECREATION_CROP, DEFAULT_ANCHOR_Y);
const USER_ICON = L.icon({
    iconUrl: userTracker,
    iconSize: [128, 95],
    iconAnchor: [64, 85],
});

export function GetBusIcon(icon: string) {
    const faceW = Math.round(MARKER_WIDTH * 0.52);
    const faceH = Math.max(34, Math.round(MARKER_HEIGHT * 0.82));
    const sideW = Math.round((MARKER_WIDTH - faceW) / 2);
    const sideH = Math.round(MARKER_HEIGHT * 0.5);
    const imgURL = icon === "busIconNorth" ? busIconNorth : icon === "busIconSouth" ? busIconSouth : icon === "busIconEast" ? busIconEast : busIconWest;
    return buildIcon(imgURL, ACADEMIC_CROP, BUS_ANCHOR_Y);
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

export function GetUserIcon(icon:string) {
    return USER_ICON;
}

