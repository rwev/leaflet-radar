import * as L from 'leaflet';

const DEFAULT_OVERLAY_LAYER_OPTIONS = {
	format: 'image/png',
	transparent: true,
	opacity: 0.575,
	zIndex: 200
}

const NEXRAD_URL = 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi';
const NEXRAD_LAYER = 'nexrad-n0q-900913'; 

export interface TimeLayer { timestamp: string; tileLayer: L.TileLayer };




export function generateTimeLayers(): Array<TimeLayer>
{
	let timeLayers : Array<TimeLayer> = [];

	const TOTAL_INTERVALS = 10;
	const INTERVAL_LENGTH_HRS = 5;

	const currentTime = new Date();
	
        for (let i = 0; i <= TOTAL_INTERVALS; i++) {

        const timeDiffMins = TOTAL_INTERVALS * INTERVAL_LENGTH_HRS - INTERVAL_LENGTH_HRS * i;
        if (timeDiffMins === 5) { continue; } // broken IDKY
		const layerRequest = NEXRAD_LAYER + (!!timeDiffMins ? '-m' + timeDiffMins + 'm' : '');
                const layer: L.TileLayer = L.tileLayer.wms(
                        NEXRAD_URL, 
                        {
			        layers: layerRequest,
        			...DEFAULT_OVERLAY_LAYER_OPTIONS
                        }
                );

		const timeString = new Date(currentTime.valueOf() - timeDiffMins * 60 * 1000).toLocaleTimeString();
		timeLayers.push({ timestamp: `${timeString} (-${timeDiffMins} min)`, tileLayer: layer });
	}
	return timeLayers;
}
