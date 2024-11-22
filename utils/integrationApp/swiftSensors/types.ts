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
