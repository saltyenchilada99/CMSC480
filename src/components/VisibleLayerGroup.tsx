import { ReactNode, memo, useEffect, useRef } from "react";
import L from "leaflet";
import { LayerGroup, useMap } from "react-leaflet";

/**
 * Leaflet layer wrapper that can be toggled without unmounting its children.
 *
 * Keeping the LayerGroup instance stable prevents marker/popup state from being
 * recreated every time the user toggles a category in the layer panel.
 */
type VisibleLayerGroupProps = {
    visible: boolean;
    children: ReactNode;
};

/** Adds or removes the backing Leaflet layer while preserving React children. */
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
