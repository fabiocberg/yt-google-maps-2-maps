import { StandaloneSearchBox } from "@react-google-maps/api";
import { useState } from "react";

type SearchBoxItem = {
    id: string;
    ref: google.maps.places.SearchBox;
    distance: number;
};

export type PointItem = {
    point: google.maps.LatLngLiteral;
    formattedAddress: string;
    distance: number;
};

type AddressBoxProps = {
    map?: google.maps.Map;
    onTraceRoute: (points: PointItem[]) => void;
    onSelectedLocation: (point: PointItem) => void;
};

export default function AddressBox({
    map,
    onTraceRoute,
    onSelectedLocation,
}: AddressBoxProps) {
    const [origin, setOrigin] = useState<PointItem | null>(null);
    const [destination, setDestination] = useState<PointItem | null>(null);

    const [points, setPoints] = useState<PointItem[]>([]);

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
                setOrigin({
                    point: location,
                    formattedAddress: place.formatted_address || "",
                    distance: 0,
                });
                break;
            case "destination":
                setDestination({
                    point: location,
                    formattedAddress: place.formatted_address || "",
                    distance: 0,
                });
                break;
            default:
                setPoints((prev) => [
                    ...prev,
                    {
                        point: location,
                        formattedAddress: place.formatted_address || "",
                        distance: 0,
                    },
                ]);
        }
        const point: PointItem = {
            point: location,
            formattedAddress: place.formatted_address || "",
            distance: 0,
        };
        onSelectedLocation(point);
        map?.panTo(location);
    };

    const getDistance = async (
        point1: PointItem,
        point2: PointItem
    ): Promise<number> => {
        return new Promise((resolve, reject) => {
            if (!map) {
                reject(-1);
                return;
            }
            if (!point1 || !point2 || !point1.point || !point2.point) {
                return -1;
            }
            const directionsService = new google.maps.DirectionsService();
            const directionsRenderer = new google.maps.DirectionsRenderer();
            directionsRenderer.setMap(map); // Existing map object displays directions
            // Create route from existing points used for markers
            const request: any = {
                origin: point1.point,
                destination: point2.point,
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
            let orderedPoints: PointItem[] = [];
            if (points.length === 0) {
                const dist = await getDistance(origin, destination);
                routePoints.push({
                    point: origin.point,
                    formattedAddress: origin.formattedAddress,
                    distance: 0,
                });
                routePoints.push({
                    point: destination.point,
                    formattedAddress: destination.formattedAddress,
                    distance: dist,
                });
            } else if (points.length === 1) {
                let dist = await getDistance(origin, points[0]);
                routePoints.push({
                    point: origin.point,
                    formattedAddress: origin.formattedAddress,
                    distance: 0,
                });
                routePoints.push({
                    point: points[0].point,
                    formattedAddress: points[0].formattedAddress,
                    distance: dist,
                });
                dist = await getDistance(points[0], destination);
                routePoints.push({
                    point: destination.point,
                    formattedAddress: destination.formattedAddress,
                    distance: dist,
                });
            } else if (points.length > 1) {
                const _points: PointItem[] = [];
                for (const p1 of points) {
                    let found = false;
                    let count = 0;
                    for (const p2 of points) {
                        if (
                            p1.point.lat === origin.point.lat &&
                            p1.point.lng === origin.point.lng
                        ) {
                            found = true;
                            break;
                        }
                        if (
                            p2.point.lat === destination.point.lat &&
                            p2.point.lng === destination.point.lng
                        ) {
                            found = true;
                            break;
                        }
                        if (
                            p1.point.lat === p2.point.lat &&
                            p1.point.lng === p2.point.lng
                        ) {
                            count++;
                        }
                        if (count > 1) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        _points.push(p1);
                    }
                }
                _points.unshift(origin);
                _points.push(destination);

                for (let i = 1; i < _points.length; i++) {
                    const dist = await getDistance(_points[i - 1], _points[i]);
                    if (dist === -1) {
                        continue;
                    }
                    routePoints.push({
                        point: _points[i - 1].point,
                        formattedAddress: _points[i - 1].formattedAddress,
                        distance: dist,
                    });
                }

                const dist = await getDistance(
                    _points[_points.length - 2],
                    _points[_points.length - 1]
                );
                routePoints.push({
                    point: _points[_points.length - 1].point,
                    formattedAddress:
                        _points[_points.length - 1].formattedAddress,
                    distance: dist,
                });

                orderedPoints = [...routePoints];
                const _origin = routePoints[0];
                const _destination = routePoints[routePoints.length - 1];

                orderedPoints = orderedPoints.slice(1, routePoints.length - 1);

                orderedPoints.sort((a, b) => {
                    if (a.distance < b.distance) {
                        return -1;
                    }
                    if (a.distance > b.distance) {
                        return 1;
                    }
                    return 0;
                });

                orderedPoints.unshift(_origin);
                orderedPoints.push(_destination);
            }
            console.log("routePoints: ", routePoints);
            onTraceRoute(orderedPoints);
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
