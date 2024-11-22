export interface ISwiftSensorDeviceForDB {
    name: string;
    collector_id: string;
    collector_ip: string;
    battery_level: number;
    signal_strength: number;
    type: string;
    temperature?: number | null;
    status?: number | null;
    value?: number | null;
    deviceId: string;
}

class Device {
    #name: string;
    #collector_id: string;
    #collector_ip: string;
    #battery_level: number;
    #signal_strength: number;
    #type: string;
    #temperature: number | null;
    #status: number | null;
    #value: number | null;
    #deviceId: string;

    constructor(data: ISwiftSensorDeviceForDB) {
        this.#name = data.name;
        this.#collector_id = data.collector_id;
        this.#collector_ip = data.collector_ip;
        this.#battery_level = data.battery_level;
        this.#signal_strength = data.signal_strength;
        this.#type = data.type;
        this.#temperature = data.temperature !== undefined ? data.temperature : null;
        this.#status = data.status !== undefined ? data.status : null;
        this.#value = data.value !== undefined ? data.value : null;
        this.#deviceId = data.deviceId;
    }

    getName(): string {
        return this.#name;
    }

    getCollectorId(): string {
        return this.#collector_id;
    }

    getCollectorIp(): string {
        return this.#collector_ip;
    }

    getBatteryLevel(): number {
        return this.#battery_level;
    }

    getSignalStrength(): number {
        return this.#signal_strength;
    }

    getType(): string {
        return this.#type;
    }

    getTemperature(conversion: 'f' | 'c' = 'f'): number | null {
        if (this.#temperature) {
            return conversion === 'f' ? ((this.#temperature * (9 / 5)) + 32) : this.#temperature;
        }
        return this.#temperature;
    }

    getStatus(): string | null {
        if (this.#status) {
            return this.#status == 0 ? 'Open' : 'Closed';
        }
        return null;
    }

    getValue(): number | null {
        return this.#value;
    }

    getDeviceId(): string {
        return this.#deviceId;
    }
}

export default Device;