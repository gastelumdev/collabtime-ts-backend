// import { ISwiftSensorDeviceForDB } from "./types";


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
    #min_critical: number | null;
    #min_warning: number | null;
    #max_critical: number | null;
    #max_warning: number | null;

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
        this.#min_critical = data.min_critical !== undefined ? data.min_critical : null;
        this.#min_warning = data.min_warning !== undefined ? data.min_warning : null;
        this.#max_critical = data.max_critical !== undefined ? data.max_critical : null;
        this.#max_warning = data.max_warning !== undefined ? data.max_warning : null;
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

    getMinWarning(conversion: 'f' | 'c' = 'f'): number | null {
        if (this.#min_warning && this.#type === "Temperature") {
            return conversion === 'f' ? ((this.#min_warning * (9 / 5)) + 32) : this.#min_warning;
        }
        return this.#min_warning;
    }

    getMinCritical(conversion: 'f' | 'c' = 'f'): number | null {
        if (this.#min_critical && this.#type === "Temperature") {
            return conversion === 'f' ? ((this.#min_critical * (9 / 5)) + 32) : this.#min_critical;
        }
        return this.#min_critical;
    }

    getMaxWarning(conversion: 'f' | 'c' = 'f'): number | null {
        if (this.#max_warning && this.#type === "Temperature") {
            return conversion === 'f' ? ((this.#max_warning * (9 / 5)) + 32) : this.#max_warning;
        }
        return this.#max_warning;
    }

    getMaxCritical(conversion: 'f' | 'c' = 'f'): number | null {
        if (this.#max_critical && this.#type === "Temperature") {
            return conversion === 'f' ? ((this.#max_critical * (9 / 5)) + 32) : this.#max_critical;
        }
        return this.#max_critical;
    }
}

export default Device;