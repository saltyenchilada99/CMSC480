import { Marker, Popup } from 'react-leaflet';
// @ts-ignore
import { GetFoodIcon } from './busMarkers.tsx';

type DiningVenue = {
    name: string;
    type: string;
    hours: string;
};

type FoodLocation = {
    name: string;
    lat: number;
    long: number;
    desc: string;
    venues: DiningVenue[];
    key: string;
};

const foodLocations: FoodLocation[] = [
    {
        name: "Scranton Commons",
        lat: 41.00585,
        long: 76.45010,
        desc: "Main campus dining facility with multiple options.",
        venues: [
            {
                name: "Scranton Commons Dining Hall",
                type: "All-you-care-to-eat buffet — 13 stations including rotisserie, pizza, soups, salad bar, and allergen-free True Balance station",
                hours: "Mon–Fri: Breakfast 7–10:30am, Lunch 10:30am–2pm, Dinner 4–8pm | Sat–Sun: Brunch 10am–2pm, Dinner 4:30–7pm",
            },
            {
                name: "Bento Sushi",
                type: "Fresh sushi and Asian cuisine",
                hours: "Follows Scranton Commons hours",
            },
            {
                name: "Subway",
                type: "Made-to-order subs, wraps, and salads",
                hours: "Mon–Fri: 10:30am–8:30pm | Sat–Sun: 12–8pm",
            },
            {
                name: "Starbucks",
                type: "Espresso drinks, teas, Frappuccinos, pastries",
                hours: "Mon–Thu: 7:30am–11pm | Fri: 7:30–8:30pm | Sat–Sun: 10:30am–8:30pm",
            },
            {
                name: "Dunkin'",
                type: "Coffee, donuts, bagels, breakfast sandwiches",
                hours: "Mon–Fri: 7:30am–4pm | Sat–Sun: Closed",
            },
        ],
        key: "F-1",
    },
    {
        name: "Kehr Union Building",
        lat: 41.00652,
        long: 76.45020,
        desc: "Student union food court on the 3rd floor.",
        venues: [
            {
                name: "Husky Lounge — Italian Kitchen",
                type: "Pizza, pretzels, wings, mac & cheese, walking tacos",
                hours: "Mon–Fri: 11am–12am | Sat: 5pm–12am | Sun: 11am–12am",
            },
            {
                name: "Husky Lounge — Burgers + Fries",
                type: "Hamburgers, chicken sandwiches, combo meals",
                hours: "Mon–Fri: 11am–12am | Sat: 5pm–12am | Sun: 11am–12am",
            },
            {
                name: "Husky Lounge — The Sandwich Shack",
                type: "Grilled flatbread sandwiches, subs, paninis",
                hours: "Mon–Fri: 11am–3pm | Sat–Sun: Closed",
            },
            {
                name: "Husky Lounge — BU Bagel Deli",
                type: "Customizable bagels, wraps, breakfast sandwiches",
                hours: "Mon–Fri: 11am–9pm | Sat–Sun: Closed",
            },
            {
                name: "Husky Lounge — Greens to Go",
                type: "Customizable salads and soup station",
                hours: "Mon–Fri: 11am–3pm | Sat–Sun: Closed",
            },
        ],
        key: "F-2",
    },
    {
        name: "Soltz Hall Dining",
        lat: 41.00657,
        long: 76.44883,
        desc: "Fast food dining on the 1st floor of Soltz Hall, open to all students.",
        venues: [
            {
                name: "Chick-fil-A",
                type: "Chicken sandwiches, nuggets, waffle fries, salads",
                hours: "Mon–Thu: 11am–8pm | Fri: 11am–7pm | Sat: 12–7pm | Sun: Closed",
            },
            {
                name: "Qdoba Mexican Eats",
                type: "Burritos, tacos, burrito bowls, quesadillas",
                hours: "Mon–Fri: 11am–3pm | Sat–Sun: Closed",
            },
        ],
        key: "F-3",
    },
    {
        name: "Andruss Library",
        lat: 41.00910,
        long: 76.44532,
        desc: "Coffee and snacks inside the Harvey A. Andruss Library.",
        venues: [
            {
                name: "Starbucks",
                type: "Espresso drinks, teas, pastries, breakfast sandwiches, snacks",
                hours: "Mon–Wed: 8am–6pm | Thu: 8am–5pm | Fri: 8am–4pm | Sat–Sun: Closed",
            },
        ],
        key: "F-4",
    },
    {
        name: "Monty's",
        lat: 41.01545,
        long: 76.44834,
        desc: "Upper campus café popular with student-athletes. Serves rotisserie, quesadillas, specialty burgers, smoked BBQ, fresh-Mex, and weekly smoked meat specials.",
        venues: [
            {
                name: "Monty's",
                type: "Rotisserie, BBQ, fresh-Mex, specialty burgers, Greens to Go",
                hours: "Mon–Fri: 8am–9pm | Sat–Sun: 11am–8pm",
            },
        ],
        key: "F-5",
    },
    {
        name: "Warren Student Services Center",
        lat: 41.00771,
        long: 76.44805,
        desc: "Self-serve vending kiosks available 24/7 (formerly Roongo's Café).",
        venues: [
            {
                name: "Self-Serve Vending Kiosks",
                type: "Snacks, beverages, and light meals",
                hours: "24/7",
            },
        ],
        key: "F-6",
    },
];

export function Food({ foodVisibility = {} }: { foodVisibility?: Record<string, boolean> }) {
    return (
        <>
            {foodLocations.filter((location) => foodVisibility[location.key] !== false).map((location: FoodLocation) => (
                <Marker
                    key={location.key}
                    position={[location.lat, -location.long]}
                    icon={GetFoodIcon()}
                    zIndexOffset={500}
                >
                    <Popup minWidth={260} maxWidth={300}>
                        <div style={{ marginBottom: "6px" }}>
                            <strong style={{ fontSize: "1rem" }}>{location.name}</strong>
                        </div>
                        <div style={{ color: "#555", marginBottom: "8px", fontSize: "0.82rem" }}>
                            {location.desc}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {location.venues.map((venue) => (
                                <div
                                    key={venue.name}
                                    style={{
                                        borderLeft: "3px solid #6e1020",
                                        paddingLeft: "8px",
                                    }}
                                >
                                    <div style={{ fontWeight: "700", fontSize: "0.82rem" }}>{venue.name}</div>
                                    <div style={{ fontSize: "0.77rem", color: "#444", marginTop: "2px" }}>{venue.type}</div>
                                    <div style={{ fontSize: "0.74rem", color: "#777", marginTop: "2px" }}>🕐 {venue.hours}</div>
                                </div>
                            ))}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </>
    );
}
