import DataCollection from "../../../models/dataCollection.model";
import Row from "../../../models/row.models";
import Workspace from "../../../models/workspace.model";
import { IWorkspace } from "../../../services/workspace.service";
import Device from "./Device";
import Treemap from "./Treemap";

import Logger from "../../logger/Logger";
import Threshold from "./Threshold";
import Column from "../../../models/column.model";

const logger = new Logger();

class SwiftSensorsIntegration {
    async syncOne(workspaceId: string) {
        const treemap = await Treemap.initialize(workspaceId);
        const thresholdInstance = await Threshold.initialize(workspaceId);
        const thresholds = thresholdInstance?.getData()

        const workspace = await Workspace.findOne({ _id: workspaceId })
        const devicesDataCollection = await DataCollection.findOne({ workspace: workspaceId, name: 'Devices' });
        const thresholdsDataCollection = await DataCollection.findOne({ workspace: workspaceId, name: 'Thresholds' });
        const rows = await Row.find({ dataCollection: devicesDataCollection?._id, isEmpty: false }).sort({ position: 1 });

        const thresholdLabels = thresholds.map((item: IThreshold) => {
            return { title: item.name, color: '#00508A' }
        })

        const thresholdColumn = await Column.findOne({ dataCollection: devicesDataCollection?._id, name: 'threshold_name' });
        const updatedColumn = await Column.findByIdAndUpdate(thresholdColumn?._id, { labels: [{ title: 'None', color: '#00508A' }, ...thresholdLabels] })

        if (treemap !== undefined) {
            for (const device of treemap.devices) {

                const fullDevice = await this.buildDevice(workspaceId, treemap, device, thresholds);
                const values = await this.buildDeviceValues(fullDevice);

                for (const row of rows) {
                    if (row.values.deviceId === fullDevice.getDeviceId()) {
                        const updatedRow = await Row.findByIdAndUpdate(row?._id, { values: { ...values, rowId: row?._id } }, { new: true });
                        logger.info(`${fullDevice.getName()} updated successfully.`);
                    }
                }
            }
        } else {
            logger.error(`Treemap for workspace ${workspace?.name} was unable to initialize.`)
        }

        Threshold.setup(workspaceId, thresholds, false);
    }

    async syncAll() {
        const workspaces = await Workspace.find({ type: 'integration' });


        for (const workspace of workspaces) {

            await this.syncOne(workspace._id);
        }
    }

    async buildDevice(workspaceId: string, treemap: Treemap, device: ISwiftSensorDevice, thresholds: IThreshold[]) {
        const collector: ISwiftSensorCollector = treemap.data[device.parent];
        const sensor: ISwiftSensorSensor = treemap.data[device.children[0]]

        let threshold: IThreshold | undefined;

        for (const t of thresholds) {
            if (t.sensorIds.includes(Number(device.children[0].split("_")[1]))) {
                threshold = t;
            }
        }

        const fullDevice = new Device({
            name: device.name,
            collector_id: device.parent,
            collector_ip: collector.ip,
            battery_level: device.batteryLevel,
            signal_strength: device.signalStrength,
            type: sensor.profileName,
            temperature: sensor.profileName === 'Temperature' ? sensor.value : null,
            status: sensor.profileName === 'Door' ? sensor.value : null,
            value: sensor.profileName === "Electric Potential (DC)" ? sensor.value : null,
            deviceId: sensor.parent,
            threshold_name: threshold !== undefined ? threshold.name : null,
            min_critical: threshold !== undefined ? threshold.minCritical : null,
            min_warning: threshold !== undefined ? threshold.minWarning : null,
            max_warning: threshold !== undefined ? threshold.maxWarning : null,
            max_critical: threshold !== undefined ? threshold.maxCritical : null
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
            type: fullDevice.getType(),
            temperature: fullDevice.getTemperature(),
            status: fullDevice.getStatus(),
            value: fullDevice.getValue(),
            deviceId: fullDevice.getDeviceId(),
            threshold_name: fullDevice.getThresholdName(),
            min_critical: fullDevice.getMinCritical(),
            min_warning: fullDevice.getMinWarning(),
            max_warning: fullDevice.getMaxWarning(),
            max_critical: fullDevice.getMaxCritical()
        }

        return values
    }
}

export default SwiftSensorsIntegration;