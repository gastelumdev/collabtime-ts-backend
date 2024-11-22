import DataCollection from "../../../models/dataCollection.model";
import Row from "../../../models/row.models";
import Workspace from "../../../models/workspace.model";
import { IWorkspace } from "../../../services/workspace.service";
import Device from "./Device";
import Treemap from "./Treemap";

class SwiftSensorsIntegration {
    async syncOne(workspaceId: string) {
        const treemap = await Treemap.initialize(workspaceId);
        const workspace: IWorkspace | null = await Workspace.findOne({ _id: workspaceId });
        const dataCollection = await DataCollection.findOne({ workspace: workspaceId, name: 'Devices' });
        const dataCollectionId = dataCollection?._id;
        const rows = await Row.find({ dataCollection: dataCollectionId, isEmpty: false }).sort({ position: 1 });

        for (const device of treemap.devices) {
            const collector: ISwiftSensorCollector = treemap.data[device.parent];
            const sensor: ISwiftSensorSensor = treemap.data[device.children[0]]
            console.log({ collector, device, sensor });

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
                deviceId: sensor.parent
            });

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
                deviceId: fullDevice.getDeviceId()
            }

            console.log({ values });

            for (const row of rows) {
                if (row.values.deviceId === fullDevice.getDeviceId()) {
                    console.log({ values })
                    const updatedRow = await Row.findByIdAndUpdate(row?._id, { values: { ...values, rowId: row?._id } }, { new: true });

                    console.log({ updatedRow });
                }
            }
        }
    }

    async syncAll() {
        const workspaces = await Workspace.find({ type: 'integration' });

        for (const workspace of workspaces) {
            await this.syncOne(workspace._id);
        }
    }
}

export default SwiftSensorsIntegration;