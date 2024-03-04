import { StandaloneSearchBox } from "@react-google-maps/api";
import { useState } from "react";

type SearchBoxItem = {
    id: string;
    ref: google.maps.places.SearchBox;
    distance: number;
};

export type PointItem = {
    pointA: google.maps.LatLngLiteral;
    pointB: google.maps.LatLngLiteral;
    distance: number;
};

type AddressBoxProps = {
    map?: google.maps.Map;
    onTraceRoute: (points: PointItem[]) => void;
    onSelectedLocation: (point: google.maps.LatLngLiteral) => void;
};

export default function AddressBox({
    map,
    onTraceRoute,
    onSelectedLocation,
}: AddressBoxProps) {
    const [origin, setOrigin] = useState<google.maps.LatLngLiteral | null>(
        null
    );
    const [destination, setDestination] =
        useState<google.maps.LatLngLiteral | null>(null);

    const [points, setPoints] = useState<google.maps.LatLngLiteral[]>([]);

    const [searchBoxes, setSearchBoxes] = useState<SearchBoxItem[]>([]);

    const onLoad = (ref: google.maps.places.SearchBox, id: string) => {
        if (searchBoxes.find((i) => i.id === id) != undefined) {
            return;
        }
        setSearchBoxes((prev) => [...prev, { id, ref, distance: 0 }]);
    };

    const onPlacesChanged = (id: string) => {
        const searchBox = searchBoxes.find((i) => i.id === id)?.ref;
        if (!searchBox) {
            return;
        }
        const places = searchBox!.getPlaces();
        const place = places![0];
        const location = {
            lat: place?.geometry?.location?.lat() || 0,
            lng: place?.geometry?.location?.lng() || 0,
        };
        switch (id) {
            case "origin":
                setOrigin(location);
                break;
            case "destination":
                setDestination(location);
                break;
            default:
                setPoints((prev) => [...prev, location]);
        }
        onSelectedLocation(location);
        map?.panTo(location);
    };

    const getDistance = async (
        point1: google.maps.LatLngLiteral,
        point2: google.maps.LatLngLiteral
    ): Promise<number> => {
        return new Promise((resolve, reject) => {
            if (!map) {
                reject(-1);
                return;
            }
            const directionsService = new google.maps.DirectionsService();
            const directionsRenderer = new google.maps.DirectionsRenderer();
            directionsRenderer.setMap(map); // Existing map object displays directions
            // Create route from existing points used for markers
            const request: any = {
                origin: point1,
                destination: point2,
                travelMode: "DRIVING",
            };

            directionsService.route(
                request,
                function (response: any, status: any) {
                    // anonymous function to capture directions
                    if (status !== "OK") {
                        reject(-1);
                    } else {
                        const directionsData = response.routes[0].legs[0]; // Get data about the mapped route
                        if (!directionsData) {
                            reject(-1);
                        } else {
                            return resolve(directionsData.distance.value); // The distance in meters.
                        }
                    }
                }
            );
        });
    };

    const traceRoute = async () => {
        if (origin && destination) {
            const routePoints: PointItem[] = [];
            const orderedPoints = [];
            if (points.length === 0) {
                const dist = await getDistance(origin, destination);
                routePoints.push({
                    pointA: origin,
                    pointB: destination,
                    distance: dist,
                });
            } else if (points.length === 1) {
                let dist = await getDistance(origin, points[0]);
                routePoints.push({
                    pointA: origin,
                    pointB: points[0],
                    distance: dist,
                });
                dist = await getDistance(points[0], destination);
                routePoints.push({
                    pointA: points[0],
                    pointB: destination,
                    distance: dist,
                });
            } else if (points.length > 1) {
                for (let i = 0; i < points.length - 1; i++) {
                    if (i + 1 === points.length) {
                        break;
                    }
                    const dist = await getDistance(points[i], points[i + 1]);
                    orderedPoints.push({
                        pointA: points[i],
                        pointB: points[i + 1],
                        distance: dist,
                    });
                }
                orderedPoints.sort((a, b) => {
                    if (a.distance < b.distance) {
                        return -1;
                    } else {
                        return 1;
                    }
                });
                let distance = await getDistance(origin, points[0]);
                routePoints.push({
                    pointA: origin,
                    pointB: points[0],
                    distance: distance,
                });
                for (let i = 0; i < orderedPoints.length - 1; i++) {
                    routePoints.push(orderedPoints[i]);
                }
                distance = await getDistance(
                    points[orderedPoints.length - 1],
                    destination
                );
                routePoints.push({
                    pointA: points[orderedPoints.length - 1],
                    pointB: destination,
                    distance: distance,
                });
            }
            console.log("routePoints: ", routePoints);
            onTraceRoute(routePoints);
        }
    };

    return (
        <div className="address">
            <StandaloneSearchBox
                onLoad={(ref) => onLoad(ref, "origin")}
                onPlacesChanged={() => onPlacesChanged("origin")}
            >
                <input
                    className="addressField"
                    placeholder="Digite o endereço inicial"
                />
            </StandaloneSearchBox>

            {/* ROUTES */}

            <StandaloneSearchBox
                onLoad={(ref) => onLoad(ref, "2")}
                onPlacesChanged={() => onPlacesChanged("2")}
            >
                <input
                    className="addressField"
                    placeholder="Digite outro endereço"
                />
            </StandaloneSearchBox>

            <StandaloneSearchBox
                onLoad={(ref) => onLoad(ref, "3")}
                onPlacesChanged={() => onPlacesChanged("3")}
            >
                <input
                    className="addressField"
                    placeholder="Digite outro endereço"
                />
            </StandaloneSearchBox>

            <StandaloneSearchBox
                onLoad={(ref) => onLoad(ref, "4")}
                onPlacesChanged={() => onPlacesChanged("4")}
            >
                <input
                    className="addressField"
                    placeholder="Digite outro endereço"
                />
            </StandaloneSearchBox>

            <StandaloneSearchBox
                onLoad={(ref) => onLoad(ref, "destination")}
                onPlacesChanged={() => onPlacesChanged("destination")}
            >
                <input
                    className="addressField"
                    placeholder="Digite o endereço final"
                />
            </StandaloneSearchBox>
            <button onClick={traceRoute}>Traçar rota</button>
        </div>
    );
}
