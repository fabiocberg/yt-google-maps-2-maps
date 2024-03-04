import React, { useState } from "react";
import {
    GoogleMap,
    Marker,
    LoadScript,
    DirectionsService,
    DirectionsRenderer,
} from "@react-google-maps/api";
import "./MapPage.css";
import AddressBox, { PointItem } from "../components/AddressBox";

const libraries: any[] = ["places"];

export interface MapViewProps {}

export default function MapView() {
    const [map, setMap] = React.useState<google.maps.Map>();

    const [points, setPoints] = useState<PointItem[]>([]);
    const [locations, setLocations] = useState<PointItem[]>([]);

    const [response, setResponse] =
        React.useState<google.maps.DistanceMatrixResponse | null>(null);

    const position = {
        lat: -27.590824,
        lng: -48.551262,
    };

    const onMapLoad = (map: google.maps.Map) => {
        setMap(map);
    };

    const directionsServiceOptions =
        // @ts-ignore
        React.useMemo<google.maps.DirectionsRequest>(() => {
            if (points.length === 0 || points[0].point === undefined) {
                return null;
            }
            return {
                origin: points[0].point,
                waypoints:
                    points.length > 2
                        ? points.slice(1, points.length - 1).map((p) => ({
                              location: p.point,
                          }))
                        : [],
                destination: points[points.length - 1].point,
                travelMode: "DRIVING",
            };
        }, [points]);

    const directionsCallback = React.useCallback((res: any) => {
        if (res !== null && res.status === "OK") {
            setResponse(res);
        } else {
            console.log(res);
        }
    }, []);

    const directionsRendererOptions = React.useMemo<any>(() => {
        return {
            directions: response,
        };
    }, [response]);

    return (
        <div className="map">
            <LoadScript
                googleMapsApiKey={`${import.meta.env.VITE_GOOGLE_API}`}
                libraries={libraries}
            >
                <GoogleMap
                    onLoad={onMapLoad}
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    center={position}
                    zoom={15}
                >
                    <AddressBox
                        map={map}
                        onTraceRoute={setPoints}
                        onSelectedLocation={(point) =>
                            setLocations((prev) => [...prev, point])
                        }
                    />

                    {locations.map((p, i) => (
                        <Marker key={`marker-item-${i}`} position={p.point} />
                    ))}

                    {points.length > 0 && (
                        <DirectionsService
                            options={directionsServiceOptions}
                            callback={directionsCallback}
                        />
                    )}

                    {points.length > 0 &&
                        response &&
                        directionsRendererOptions && (
                            <DirectionsRenderer
                                options={directionsRendererOptions}
                            />
                        )}
                </GoogleMap>
            </LoadScript>
        </div>
    );
}
