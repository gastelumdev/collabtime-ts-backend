import axios from "axios";
import Workspace from "../../../models/workspace.model";
import { IIntegrationSettings } from "../../../services/workspace.service";
import logger from '../../logger';
import DataCollection from "../../../models/dataCollection.model";
import Column from "../../../models/column.model";
import Row from "../../../models/row.models";
import { cToF } from "../../helpers";

class Threshold {
    #data: any;
    private constructor(data: any) {
        this.#data = data;
    }

    static async initialize(workspaceId: string) {

        const workspace = await Workspace.findOne({ _id: workspaceId });
        const devicesDataCollection = await DataCollection.findOne({ workspace: workspaceId, name: "Devices" });
        const thresholdNameColumn = await Column.findOne({ dataCollection: devicesDataCollection?._id, name: 'threshold_name' });

        const settings: IIntegrationSettings | undefined = workspace?.settings?.integration.swiftSensors;

        const { apiKey, accessToken, accountId, tokenType, email }: any = settings;
        const url = `https://api.swiftsensors.net/api/client/v1/accounts/${accountId}/thresholds`;

        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'Authorization': `${tokenType} ${accessToken}`
        }
        try {
            const thresholdResponse = await axios.get(url, { headers });

            if (thresholdResponse.status === 200) {
                logger.info(`Swift Sensors thresholds for ${email} fetched successfully`)

                return new Threshold(thresholdResponse.data);
            } else {
                logger.info(`Swift Sensors thresholds for ${email} fetched unsuccessfully`)
            }

        } catch (err) {
            logger.error(`Swift Sensors thresholds for ${email} fetched unsuccessfully`);
            // throw new Error("403 Response");
        }
    }

    getData() {
        return this.#data;
    }

    static async update(workspaceId: string, threshold: IThreshold) {
        const workspace = await Workspace.findOne({ _id: workspaceId });

        const settings: IIntegrationSettings | undefined = workspace?.settings?.integration.swiftSensors;

        const { apiKey, accessToken, accountId, tokenType, email }: any = settings;
        const url = `https://api.swiftsensors.net/api/client/v1/accounts/${accountId}/thresholds/${threshold.id}`;

        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'Authorization': `${tokenType} ${accessToken}`
        }

        try {
            const thresholdResponse = await axios.post(url, threshold, { headers });

            if (thresholdResponse.status === 200) {
                logger.info(`Swift Sensors thresholds for ${email} updated successfully`)
                return thresholdResponse.data;
            } else {
                logger.error(`Swift Sensor for ${workspace?.name}, id ${threshold.id}, updated unsuccessfully`)
                return null;
            }
        } catch (error) {
            logger.error(`Swift Sensor for ${workspace?.name}, id ${threshold.id}, updated unsuccessfully`);
            return null;
        }
    }

    static async setup(workspaceId: string, thresholds: IThreshold[], initialSetup: boolean = false) {
        const workspace = await Workspace.findOne({ _id: workspaceId });
        const devicesDataCollection = await DataCollection.findOne({ workspace: workspaceId, name: "Devices" });
        const thresholdsDataCollection = await DataCollection.findOne({ workspace: workspaceId, name: "Thresholds" });
        const rows = await Row.find({ dataCollection: thresholdsDataCollection }).sort({ position: 1 });

        for (const i in rows) {
            try {
                const threshold = thresholds[i]

                const newThreshold = {
                    id: threshold.id,
                    name: threshold.name,
                    description: threshold.description,
                    max_critical: threshold.maxCritical !== undefined ? threshold.description === "Temperature" ? cToF(threshold.maxCritical) : threshold.maxCritical : null,
                    min_critical: threshold.minCritical !== undefined ? threshold.description === "Temperature" ? cToF(threshold.minCritical) : threshold.minCritical : null,
                    max_warning: threshold.maxWarning !== undefined ? threshold.description === "Temperature" ? cToF(threshold.maxWarning) : threshold.maxWarning : null,
                    min_warning: threshold.minWarning !== undefined ? threshold.description === "Temperature" ? cToF(threshold.minWarning) : threshold.minWarning : null
                }

                const updatedRow = await Row.findByIdAndUpdate(rows[i]?._id, { values: newThreshold, isEmpty: false }, { new: true });

                if (updatedRow) {
                    logger.info(`${threshold.name} threshold update for ${workspace?.name} was successful.`);
                } else {
                    logger.error(`${threshold.name} threshold update for ${workspace?.name} was unsuccessful.`);
                }
            } catch (error) {
                const newThreshold = { name: '' }
                const rowThresholdName = rows[i]?.values.name;
                if (rowThresholdName !== undefined && rowThresholdName !== "") {
                    const updatedRow = await Row.findByIdAndUpdate(rows[i]?._id, { values: newThreshold, isEmpty: true }, { new: true });

                    if (updatedRow) {
                        logger.info(`${rowThresholdName} threshold removal for ${workspace?.name} was successful.`)
                    } else {
                        logger.error(`${rowThresholdName} threshold removal for ${workspace?.name} was unsuccessful.`)
                    }

                    const thresholdColumn = await Column.findOne({ dataCollection: devicesDataCollection?._id, name: 'threshold_name' });
                    const labels = thresholdColumn?.labels;

                    const newLabels = labels?.filter((label: { title: string, color: string }) => {
                        return label.title !== rowThresholdName
                    });

                    const updatedColumn = await Column.findByIdAndUpdate(thresholdColumn?._id, { labels: newLabels }, { new: true });
                }

            }
        }

        // for (const threshold of thresholds) {

        //     if (initialSetup) {
        //         const newThreshold = {
        //             id: threshold.id,
        //             name: threshold.name,
        //             description: threshold.description,
        //             max_critical: threshold.maxCritical !== undefined ? threshold.description === "Temperature" ? cToF(threshold.maxCritical) : threshold.maxCritical : null,
        //             min_critical: threshold.minCritical !== undefined ? threshold.description === "Temperature" ? cToF(threshold.minCritical) : threshold.minCritical : null,
        //             max_warning: threshold.maxWarning !== undefined ? threshold.description === "Temperature" ? cToF(threshold.maxWarning) : threshold.maxWarning : null,
        //             min_warning: threshold.minWarning !== undefined ? threshold.description === "Temperature" ? cToF(threshold.minWarning) : threshold.minWarning : null
        //         }
        //         const row = await Row.findOne({ dataCollection: thresholdsDataCollection?._id, isEmpty: true }).sort({ position: 1 });
        //         const updatedRow = await Row.findByIdAndUpdate(row?._id, { values: newThreshold, isEmpty: false }, { new: true });

        //         if (updatedRow) {
        //             logger.info(`${threshold.name} threshold initialization setup for ${workspace?.name} was successful.`)
        //         } else {
        //             logger.error(`${threshold.name} threshold initialization setup for ${workspace?.name} was unsuccessful.`)
        //         }
        //     } else {
        //         const newThreshold = {
        //             id: threshold.id,
        //             name: threshold.name,
        //             description: threshold.description,
        //             max_critical: threshold.maxCritical !== undefined ? threshold.description === "Temperature" ? cToF(threshold.maxCritical) : threshold.maxCritical : null,
        //             min_critical: threshold.minCritical !== undefined ? threshold.description === "Temperature" ? cToF(threshold.minCritical) : threshold.minCritical : null,
        //             max_warning: threshold.maxWarning !== undefined ? threshold.description === "Temperature" ? cToF(threshold.maxWarning) : threshold.maxWarning : null,
        //             min_warning: threshold.minWarning !== undefined ? threshold.description === "Temperature" ? cToF(threshold.minWarning) : threshold.minWarning : null
        //         }
        //         const rows = await Row.find({ dataCollection: thresholdsDataCollection?._id }).sort({ position: 1 });

        //         for (const row of rows) {
        //             if (row?.values.id === newThreshold.id) {

        //                 const updatedRow = await Row.findByIdAndUpdate(row?._id, { values: newThreshold }, { new: true });

        //                 if (updatedRow) {
        //                     logger.info(`${threshold.name} threshold update for ${workspace?.name} was successful.`)
        //                 } else {
        //                     logger.error(`${threshold.name} threshold update for ${workspace?.name} was unsuccessful.`)
        //                 }
        //             }
        //         }
        //     }

        // }
    }
}

export default Threshold;