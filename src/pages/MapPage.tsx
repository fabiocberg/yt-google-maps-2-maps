import "./MapPage.css";
import MapView from "./MapView";

export interface MapPageProps {}

const MapPage = () => {
    return (
        <div className="map">
            <MapView />
        </div>
    );
};

export default MapPage;
