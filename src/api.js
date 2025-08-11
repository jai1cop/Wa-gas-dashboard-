import { AEMO_API_BASE_URL } from './config';

const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    return lines.slice(1).map(line => {
        const values = line.split(',');
        return header.reduce((obj, nextKey, index) => {
            obj[nextKey] = values[index] ? values[index].trim().replace(/"/g, '') : '';
            return obj;
        }, {});
    });
};

const getYYYYMMString = (date) => date.toISOString().slice(0, 7);

export const fetchWithRetry = async (url, options = {}, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }
            return response;
        } catch (error) {
            console.error(`Attempt ${i + 1} for ${url} failed. Retrying in ${delay}ms...`);
            if (i < retries - 1) {
                await new Promise(res => setTimeout(res, delay));
            } else {
                throw new Error(`All retries failed for ${url}: ${error.message}`);
            }
        }
    }
};

export const fetchAemoData = async () => {
    const [capacityRes, mtcRes] = await Promise.all([
        fetchWithRetry(`${AEMO_API_BASE_URL}/capacityOutlook/current`),
        fetchWithRetry(`${AEMO_API_BASE_URL}/mediumTermCapacity/current`),
    ]);

    const capacityData = await capacityRes.json();
    const mtcData = await mtcRes.json();

    const today = new Date();
    const monthPromises = [];
    for (let i = 0; i < 24; i++) {
        const date = new Date(today);
        date.setMonth(today.getMonth() - i);
        const monthString = getYYYYMMString(date);
        monthPromises.push(fetchWithRetry(`${AEMO_API_BASE_URL}/actualFlow/${monthString}.csv`));
        monthPromises.push(fetchWithRetry(`${AEMO_API_BASE_URL}/largeUserConsumption/${monthString}.csv`));
    }

    const responses = await Promise.all(monthPromises);
    const csvTexts = await Promise.all(responses.map(res => res.ok ? res.text() : ''));

    const flowData = csvTexts.flatMap((csv, index) => (index % 2 === 0 ? parseCSV(csv) : []));
    const consumptionData = csvTexts.flatMap((csv, index) => (index % 2 !== 0 ? parseCSV(csv) : []));

    return { capacityData, mtcData, flowData, consumptionData };
};
