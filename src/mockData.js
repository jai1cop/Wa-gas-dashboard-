export const generateMockStorageData = (days = 365) => {
    const mockData = [];
    const today = new Date();
    const totalCapacity = 60000; // Mock capacity in TJ
    let currentVolume = totalCapacity * (0.4 + Math.random() * 0.2); // Start between 40-60%

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        const seasonalFactor = Math.sin((date.getMonth() / 12) * 2 * Math.PI - Math.PI / 2); // Winter withdrawal, summer injection
        const randomFactor = (Math.random() - 0.5) * 500;
        const netFlow = -seasonalFactor * 2000 + randomFactor;

        currentVolume += netFlow;
        // Clamp volume within realistic bounds (e.g., 5% to 95% of capacity)
        currentVolume = Math.max(totalCapacity * 0.05, Math.min(totalCapacity * 0.95, currentVolume));

        mockData.push({
            date: date.toLocaleDateString('en-CA'),
            netFlow: parseFloat(netFlow.toFixed(1)),
            totalVolume: parseFloat(currentVolume.toFixed(1)),
        });
    }

    return {
        storageAnalysis: mockData,
        totalStorageCapacity: totalCapacity,
    };
};

export const generateMockLiveData = () => {
    const mockStorage = generateMockStorageData();
    // In a real scenario, you'd mock all the other parts of liveData too.
    // For this task, we only need to mock the data for the storage chart.
    return {
        processedFlows: [],
        facilityInfo: {},
        storageAnalysis: mockStorage.storageAnalysis,
        totalStorageCapacity: mockStorage.totalStorageCapacity,
        facilityConsumption: [],
        volatility: [],
        alignedFlows: [],
        supplyOnly: [],
        // Add other necessary fields with empty/default values
        forecastStartDate: new Date().toLocaleDateString('en-CA'),
    };
};
