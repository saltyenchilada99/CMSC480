import { ReactNode, memo, useEffect, useRef } from "react";
import L from "leaflet";
import { LayerGroup, useMap } from "react-leaflet";

type VisibleLayerGroupProps = {
    visible: boolean;
    children: ReactNode;
};

export const VisibleLayerGroup = memo(function VisibleLayerGroup({
    visible,
    children,
}: VisibleLayerGroupProps) {
    const map = useMap();
    const groupRef = useRef<L.LayerGroup | null>(null);

    useEffect(() => {
        const group = groupRef.current;
        if (!group) return;

        if (visible) {
            if (!map.hasLayer(group)) {
                group.addTo(map);
            }
            return;
        }

        if (map.hasLayer(group)) {
            map.removeLayer(group);
        }
    }, [map, visible]);

    return <LayerGroup ref={groupRef}>{children}</LayerGroup>;
});
