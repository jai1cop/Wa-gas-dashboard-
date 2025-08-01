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

export const fetchAemoData = async () => {
    const [capacityRes, mtcRes] = await Promise.all([
        fetch(`${AEMO_API_BASE_URL}/capacityOutlook/current`),
        fetch(`${AEMO_API_BASE_URL}/mediumTermCapacity/current`),
    ]);

    if (!capacityRes.ok) throw new Error(`Failed to fetch Capacity Outlook: ${capacityRes.statusText}`);
    if (!mtcRes.ok) throw new Error(`Failed to fetch Medium Term Capacity: ${mtcRes.statusText}`);

    const capacityData = await capacityRes.json();
    const mtcData = await mtcRes.json();

    const today = new Date();
    const monthPromises = [];
    for (let i = 0; i < 24; i++) {
        const date = new Date(today);
        date.setMonth(today.getMonth() - i);
        const monthString = getYYYYMMString(date);
        monthPromises.push(fetch(`${AEMO_API_BASE_URL}/actualFlow/${monthString}.csv`));
        monthPromises.push(fetch(`${AEMO_API_BASE_URL}/largeUserConsumption/${monthString}.csv`));
    }

    const responses = await Promise.all(monthPromises);
    const csvTexts = await Promise.all(responses.map(res => res.ok ? res.text() : ''));

    const flowData = csvTexts.flatMap((csv, index) => (index % 2 === 0 ? parseCSV(csv) : []));
    const consumptionData = csvTexts.flatMap((csv, index) => (index % 2 !== 0 ? parseCSV(csv) : []));

    return { capacityData, mtcData, flowData, consumptionData };
};
