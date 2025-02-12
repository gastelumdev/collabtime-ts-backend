interface ISwiftSensorAccount {
    name: string;
    timeZoneId: string;
    children: string[];
}

interface ISwiftSensorCollector {
    name: string;
    isNew?: boolean;               // Optional: not sent if false
    time: number;                  // Unix timestamp
    timeZoneId?: string;           // Optional: not sent if null
    latitude?: number;             // Optional: not sent if null
    longitude?: number;            // Optional: not sent if null
    parent: string;
    children: string[];
    hwId: string;
    ip: string;
}

interface ISwiftSensorDevice {
    name: string;
    isNew?: boolean;               // Optional: not sent if false
    time: number;                  // Unix timestamp
    batteryLevel: number;          // Battery level percentage
    latitude?: number;             // Optional: not sent if null
    longitude?: number;            // Optional: not sent if null
    parent: string;
    children: string[];
    hwId: string;
    signalStrength: number;
    errorCode?: number;            // Optional: not sent if 0 (NONE)
    errorTime?: number;            // Optional: not sent if errorCode is not sent
}

interface ISwiftSensorSensor {
    profileName: string;
    unitId: number;
    conversionId?: number;           // Optional: not sent if null
    prodConversionId?: number;      // Optional: not sent if null
    value: number;
    precision: number;
    time: number;                   // Unix timestamp
    thresholdStatus: number;
    thresholdId?: number;           // Optional: not sent if null
    lastNormalTime: number;
    isHidden?: boolean;             // Optional: not sent if false
    shiftScheduleId?: number;       // Optional: not sent if null
    parent: string;
}

interface ISwiftSensorDeviceForDB {
    name: string;
    collector_id: string;
    collector_ip: string;
    battery_level: number;
    signal_strength: number;
    type: string;
    temperature?: number | null;
    humidity?: number | null;
    status?: number | null;
    value?: number | null;
    deviceId: string;
    threshold_name: string | null;
    min_critical?: number | null,
    min_warning?: number | null,
    max_warning?: number | null,
    max_critical?: number | null
}

interface IThreshold {
    id: number;
    name: string;
    description: string;
    unitTypeId: number;
    maxCritical?: number;
    minCritical?: number;
    maxWarning?: number;
    minWarning?: number;
    sensorIds: number[];
    accountId: string;
}