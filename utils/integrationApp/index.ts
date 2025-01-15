import { io } from "../..";
import { IDataCollection } from "../../services/dataCollection.service";
import { IRow } from "../../services/row.service";
import { IWorkspace } from "../../services/workspace.service";
import { fToC } from "../helpers";
import SwiftSensorsIntegration from "./swiftSensors/SwiftSensorsIntegration";
import Threshold from "./swiftSensors/Threshold";
import Treemap from "./swiftSensors/Treemap";
import Logger from "../logger/Logger";
import Workspace from "../../models/workspace.model";
import Row from "../../models/row.models";
import { handleEvent } from "../../services/event.service";
import { IUser } from "../../services/auth.service";

const logger = new Logger();

export const handleIntegrationAppValueChange = async (row: IRow & { _id: string }, reqbody: IRow & { _id: string }, workspace: IWorkspace & { _id: string }, dataCollection: IDataCollection & { _id: string }, assigner: IUser) => {
    if (dataCollection?.name === "Devices") {
        try {
            // Initialize the new and the previous threshold names
            const rowThresholdName = reqbody.values.threshold_name;
            const previousRowThresholdName = row?.values.threshold_name;
            // Initialize the Swift Sensor treemap based on the workspace
            const treemap = await Treemap.initialize(workspace?._id);
            // Get the sensor id from the treemap children data
            // NOTE: the sensorId is the second part of the string
            const sensorId = Number(treemap?.data[reqbody.values.deviceId].children[0].split("_")[1]);
            // Initialize the threshold based on the workspace and get the data
            const thresholdInstance = await Threshold.initialize(workspace?._id);
            const thresholds = thresholdInstance?.getData()
            // Go through the thresholds and find the previous
            const previousThreshold = thresholds.find((item: IThreshold) => {
                return item.name === previousRowThresholdName;
            });
            // Go through the thresholds and find 
            const threshold = thresholds.find((item: IThreshold) => {
                return item.name === rowThresholdName;
            });

            if (previousThreshold !== undefined) {
                const previousSensorIds = previousThreshold.sensorIds;
                const newPreviousSensorIds = previousSensorIds.filter((id: number) => {
                    return id !== sensorId;
                });
                previousThreshold.sensorIds = newPreviousSensorIds;
                const newPreviousThreshold = await Threshold.update(workspace?._id, previousThreshold);
            }

            if (threshold !== undefined) {
                const sensorIds = threshold.sensorIds;
                const newSensorIds = [...sensorIds, sensorId];
                threshold.sensorIds = newSensorIds;
                const newThreshold = await Threshold.update(workspace?._id, threshold);
            }
        } catch (error) {
            logger.error('Something went wrong when updating the thresholds')
        }

    }

    if (dataCollection?.name === "Thresholds") {
        try {
            const values = reqbody.values;

            const thresholdInstance = await Threshold.initialize(workspace._id);
            const thresholds = thresholdInstance?.getData();

            const threshold = thresholds.find((item: IThreshold) => {
                return item.id == values.id;
            })


            const newValues = {
                id: values.id,
                name: values.name,
                description: values.description,
                maxCritical: fToC(Number(values.max_critical)),
                maxWarning: fToC(Number(values.max_warning)),
                minCritical: fToC(Number(values.min_critical)),
                minWarning: fToC(Number(values.min_warning)),
                unitTypeId: threshold.unitTypeId,
                sensorIds: threshold.sensorIds,
                accountId: threshold.accountId
            }
            const newThreshold = await Threshold.update(workspace._id, newValues);

            if (!newThreshold) {
                await Row.findByIdAndUpdate(row._id, row, { new: true });

                handleEvent({
                    actionBy: assigner as IUser,
                    assignee: null,
                    workspace: workspace?._id as string,
                    dataCollection: dataCollection?._id as string,
                    type: 'error',
                    priority: 100,
                    message: `Invalid action in ${dataCollection?.name} data collection by ${assigner?.firstname} ${assigner?.lastname}. Thresholds values must be in ascending order starting with min critical and ending with max critical.`,
                    associatedUserIds: [assigner._id?.toString()] as string[]
                }, null, [assigner._id?.toString()] as string[])
            }
        } catch (error) {
            logger.error('Something went wrong when updating the thresholds')
        }
    }

    const integration = new SwiftSensorsIntegration();
    await integration.syncAll()
    io.emit("update swift sensor data", { msg: "Swift sensor data updated" })
}

export const setInactive = async (workspaceId: string) => {
    const workspace = await Workspace.findOne({ _id: workspaceId });
    workspace!.settings!.integration.swiftSensors.active = false;

    const updatedWorkspace = await Workspace.findByIdAndUpdate(workspaceId, { settings: workspace?.settings })
}

export const setActive = async (workspaceId: string) => {
    const workspace = await Workspace.findOne({ _id: workspaceId });
    workspace!.settings!.integration.swiftSensors.active = true;

    const updatedWorkspace = await Workspace.findByIdAndUpdate(workspaceId, { settings: workspace?.settings })
}