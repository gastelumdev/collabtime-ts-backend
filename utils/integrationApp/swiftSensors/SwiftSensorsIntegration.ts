import DataCollection from "../../../models/dataCollection.model";
import Row from "../../../models/row.models";
import Workspace from "../../../models/workspace.model";
import { IWorkspace } from "../../../services/workspace.service";
import Device from "./Device";
import Treemap from "./Treemap";

import Logger from "../../logger/Logger";
import Threshold from "./Threshold";
import Column from "../../../models/column.model";
import { cToF } from "../../helpers";

const logger = new Logger();

class SwiftSensorsIntegration {
    async syncOne(workspaceId: string) {
        try {
            const treemap = await Treemap.initialize(workspaceId);
            const thresholdInstance = await Threshold.initialize(workspaceId);
            const thresholds = thresholdInstance?.getData();

            const workspace = await Workspace.findOne({ _id: workspaceId })
            const devicesDataCollection = await DataCollection.findOne({ workspace: workspaceId, name: 'Devices' });
            const thresholdsDataCollection = await DataCollection.findOne({ workspace: workspaceId, name: 'Thresholds' });
            const rows = await Row.find({ dataCollection: devicesDataCollection?._id, isEmpty: false }).sort({ position: 1 });

            const thresholdLabels = thresholds.map((item: IThreshold) => {
                return { title: item.name, color: '#00508A' };
            })

            const thresholdColumn = await Column.findOne({ dataCollection: devicesDataCollection?._id, name: 'threshold_name' });
            const updatedColumn = await Column.findByIdAndUpdate(thresholdColumn?._id, { labels: [{ title: 'None', color: '#00508A' }, ...thresholdLabels] })

            if (treemap && treemap !== undefined) {
                for (const device of treemap.devices) {

                    const fullDevice = await this.buildDevice(workspaceId, treemap, device, thresholds);
                    const values = await this.buildDeviceValues(fullDevice);

                    for (const sensor of values.sensors) {
                        const outOfBoundsData = await this.isOutOfBounds(sensor, workspace!);

                        for (const row of rows) {
                            console.log(row.values)
                            if (row.values.sensorId === sensor.sensorId) {
                                console.log({ isOutOfBounds: row.values.out_of_bounds })
                                const updatedRow = await Row.findByIdAndUpdate(row?._id, { values: { ...values, ...sensor, rowId: row?._id, out_of_bounds: outOfBoundsData.outOfBounds ? 'Yes' : 'No' } }, { new: true });
                                logger.info(`${fullDevice.getName()} updated successfully.`)
                            }
                        }
                    }


                }
            } else {
                logger.error(`Treemap for workspace ${workspace?.name} was unable to initialize.`)

                throw new Error()
            }

            Threshold.setup(workspaceId, thresholds, false);
        } catch (error) {
            logger.error('Something went wrong when updating the thresholds')
        }

    }

    async syncAll() {
        const workspaces = await Workspace.find({ type: 'integration' });


        for (const workspace of workspaces) {
            logger.info(`Integration for workspace ${workspace._id} has started`)
            await this.syncOne(workspace._id);
        }
    }

    async isOutOfBounds(sensor: ISwiftSensor, workspace: IWorkspace) {
        if (sensor.type === 'Temperature') {
            if (sensor.temperature! < sensor.min_critical!) {
                return { outOfBounds: true, message: `Temperature has reached a critical value that is below ${sensor.min_critical}` };
            } else if (sensor.temperature! < sensor.min_warning! && sensor.temperature! > sensor.min_critical!) {
                return { outOfBounds: true, message: `Temperature has reached a warning value that is below ${sensor.min_warning}` };
            } else if (sensor.temperature! > sensor.max_warning! && sensor.temperature! < sensor.max_critical!) {
                return { outOfBounds: true, message: `Temperature has reached a warning value that is above ${sensor.max_warning}` }
            } else if (sensor.temperature! > sensor.max_critical!) {
                return { outOfBounds: true, message: `Temperature has reached a critical value that is above ${sensor.max_critical}` }
            }
        }

        if (sensor.type === 'Humidity') {
            if (sensor.humidity! < sensor.min_critical!) {
                return { outOfBounds: true, message: `Humidity has reached a critical value that is below ${sensor.min_critical}` };
            } else if (sensor.humidity! < sensor.min_warning! && sensor.humidity! > sensor.min_critical!) {
                return { outOfBounds: true, message: `Humidity has reached a warning value that is below ${sensor.min_warning}` };
            } else if (sensor.humidity! > sensor.max_warning! && sensor.humidity! < sensor.max_critical!) {
                return { outOfBounds: true, message: `Humidity has reached a warning value that is above ${sensor.max_warning}` }
            } else if (sensor.humidity! > sensor.max_critical!) {
                return { outOfBounds: true, message: `Humidity has reached a critical value that is above ${sensor.max_critical}` }
            }
        }

        return { outOfBounds: false, message: '' };
    }

    async buildDevice(workspaceId: string, treemap: Treemap, device: ISwiftSensorDevice, thresholds: IThreshold[]) {
        const collector: ISwiftSensorCollector = treemap.data[device.parent];
        const sensor: ISwiftSensorSensor = treemap.data[device.children[0]];
        const sensors: ISwiftSensor[] = [];


        for (const sensorId of device.children) {
            const sensorData = treemap.data[sensorId];

            let threshold: IThreshold | undefined;

            for (const t of thresholds) {

                if (t.sensorIds.includes(Number(sensorId.split("_")[1]))) {
                    threshold = t
                }
            }

            const sensor = {
                sensorId: sensorId,
                type: sensorData.profileName,
                temperature: sensorData.profileName === 'Temperature' ? cToF(sensorData.value) : null,
                humidity: sensorData.profileName === 'Humidity' ? sensorData.value : null,
                status: sensorData.profileName === 'Door' ? sensorData.value === 0 ? 'Open' : 'Closed' : null,
                value: sensorData.profileName === "Electric Potential (DC)" ? sensorData.value : null,
                threshold_name: threshold !== undefined ? threshold.name : null,
                min_critical: threshold !== undefined && threshold.minCritical !== undefined ? sensorData.profileName === 'Temperature' ? cToF(threshold.minCritical) : threshold.minCritical : null,
                min_warning: threshold !== undefined && threshold.minWarning !== undefined ? sensorData.profileName === 'Temperature' ? cToF(threshold.minWarning) : threshold.minWarning : null,
                max_warning: threshold !== undefined && threshold.maxWarning !== undefined ? sensorData.profileName === 'Temperature' ? cToF(threshold.maxWarning) : threshold.maxWarning : null,
                max_critical: threshold !== undefined && threshold.maxCritical !== undefined ? sensorData.profileName === 'Temperature' ? cToF(threshold.maxCritical) : threshold.maxCritical : null,
            }

            sensors.push(sensor);
        }

        const fullDevice = new Device({
            name: device.name,
            collector_id: device.parent,
            collector_ip: collector.ip,
            battery_level: device.batteryLevel,
            signal_strength: device.signalStrength,
            deviceId: sensor.parent,
            sensors: sensors
            // type: sensor.profileName,
            // temperature: temperature,
            // humidity: humidity,
            // status: sensor.profileName === 'Door' ? sensor.value : null,
            // value: sensor.profileName === "Electric Potential (DC)" ? sensor.value : null,
            // threshold_name: threshold !== undefined ? threshold.name : null,
            // min_critical: threshold !== undefined ? threshold.minCritical : null,
            // min_warning: threshold !== undefined ? threshold.minWarning : null,
            // max_warning: threshold !== undefined ? threshold.maxWarning : null,
            // max_critical: threshold !== undefined ? threshold.maxCritical : null
        });

        return fullDevice;
    }

    async buildDeviceValues(fullDevice: Device) {
        const values = {
            name: fullDevice.getName(),
            collector_id: fullDevice.getCollectorId(),
            collector_ip: fullDevice.getCollectorIp(),
            battery_level: fullDevice.getBatteryLevel(),
            signal_strength: fullDevice.getSignalStrength(),
            deviceId: fullDevice.getDeviceId(),
            sensors: fullDevice.getSensors()
            // type: fullDevice.getType(),
            // temperature: fullDevice.getTemperature(),
            // humidity: fullDevice.getHumidity(),
            // status: fullDevice.getStatus(),
            // value: fullDevice.getValue(),
            // threshold_name: fullDevice.getThresholdName(),
            // min_critical: fullDevice.getMinCritical(),
            // min_warning: fullDevice.getMinWarning(),
            // max_warning: fullDevice.getMaxWarning(),
            // max_critical: fullDevice.getMaxCritical()
        }

        return values
    }
}

export default SwiftSensorsIntegration;