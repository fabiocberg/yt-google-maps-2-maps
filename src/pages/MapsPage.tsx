import MapPage from "./MapPage";
import "./MapsPage.css";

// type MapsPageProps = {}

export default function MapsPage() {
    return (
        <div className="maps">
            <MapPage />
            <div className="divisor"></div>
            <MapPage />
        </div>
    );
}
