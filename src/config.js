export const AEMO_API_BASE_URL = "https://api.fieryweb.co/v1";

export const PRODUCTION_FACILITIES = [
    "North West Shelf", "Gorgon", "Wheatstone", "Macedon",
    "Varanus Island", "Devil Creek", "Pluto", "Xyris Production Facility",
    "Walyering Production Facility", "Beharra Springs"
];

export const AEMO_FACILITY_NAME_MAP = {
    "Karratha Gas Plant": "North West Shelf",
    "Gorgon Gas Plant": "Gorgon",
};

// Reverse mapping for data processing
export const DATA_TO_DISPLAY_NAME_MAP = Object.fromEntries(
    Object.entries(AEMO_FACILITY_NAME_MAP).map(([display, data]) => [data, display])
);

export const FACILITY_CAPACITIES = {
    "North West Shelf": 630, "Gorgon Gas Plant": 300, "Wheatstone": 230,
    "Macedon": 170, "Varanus Island": 390, "Devil Creek": 50, "Pluto": 40,
    "Xyris Production Facility": 30, "Walyering Production Facility": 33, "Beharra Springs": 25
};

export const GSOO_HISTORICAL_DEMAND = { 2022: 1045, 2023: 1078, 2024: 1119 };

export const STORAGE_COLORS = { injection: '#22c55e', withdrawal: '#dc2626', volume: '#0ea5e9' };
export const VOLATILITY_COLOR = '#8884d8';
