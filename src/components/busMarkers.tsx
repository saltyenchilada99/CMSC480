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
import '../App.css';

const MARKER_WIDTH = 108;
const MARKER_HEIGHT = 81;
const DEFAULT_ANCHOR_Y = 63;
const BUS_ANCHOR_Y = 61;

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
const BUS_VERTICAL: MarkerCrop = withHitPadding({ left: 28, top: 6, width: 90, height: 105 });
const BUS_HORIZONTAL: MarkerCrop = withHitPadding({ left: 28, top: 6, width: 135, height: 135 });
const DORM_CROP: MarkerCrop = withHitPadding({ left: 30, top: 5, width: 32, height: 48 });
const BUS_STOP_CROP: MarkerCrop = withHitPadding({ left: 31, top: 4, width: 146, height: 170 });
const FOOD_CROP: MarkerCrop = withHitPadding({ left: 27, top: 9, width: 54, height: 60 });
const RECREATION_CROP: MarkerCrop = withHitPadding({ left: 27, top: 9, width: 54, height: 60 });

function buildIcon(
    iconUrl: string,
    crop: MarkerCrop,
    anchorY = DEFAULT_ANCHOR_Y,
    busVertical = false
) {
    const iconAnchorY = anchorY - crop.top;
    const adjustedAnchorY = busVertical ? iconAnchorY : crop.height * 0.75;

    return L.divIcon({
        className: '',
        html: `
    <div class="marker-pin-icon-wrapper"
         style="width:${crop.width}px;height:${crop.height}px;">
      <img
        class="marker-pin-icon-img"
        src="${iconUrl}"
        alt=""
        draggable="false"
        style="width:100%;height:100%;object-fit:contain;">
    </div>
  `,
        iconSize: [crop.width, crop.height],
        iconAnchor: [crop.width / 2, adjustedAnchorY]
    });
}

const BUS_ICON_NORTH = buildIcon(busIconNorth, BUS_VERTICAL, BUS_ANCHOR_Y, false);
const BUS_ICON_SOUTH = buildIcon(busIconSouth, BUS_VERTICAL, BUS_ANCHOR_Y, false);
const BUS_ICON_EAST = buildIcon(busIconEast, BUS_HORIZONTAL, BUS_ANCHOR_Y, true);
const BUS_ICON_WEST = buildIcon(busIconWest, BUS_HORIZONTAL, BUS_ANCHOR_Y, true);
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
    if (icon === "busIconNorth") {
        return BUS_ICON_NORTH;
    } else if (icon === "busIconSouth") {
        return BUS_ICON_SOUTH;
    } else if (icon === "busIconEast") {
        return BUS_ICON_EAST;
    }
    return BUS_ICON_WEST;
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
