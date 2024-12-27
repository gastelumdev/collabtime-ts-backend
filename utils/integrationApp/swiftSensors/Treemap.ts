import axios, { AxiosError } from "axios";
import DataCollection from "../../../models/dataCollection.model";
import Workspace from "../../../models/workspace.model";
import { IIntegrationSettings, IWorkspace } from "../../../services/workspace.service";
import Logger from "../../logger/Logger";
import { io } from "../../..";
import { setActive, setInactive } from "..";

const logger = new Logger();

class Treemap {
    workspaceId: string;
    data: any;
    account: ISwiftSensorAccount | null;
    collectors: ISwiftSensorCollector[];
    devices: ISwiftSensorDevice[];
    sensors: ISwiftSensorSensor[];

    private constructor(workspaceId: string, data: any, account: ISwiftSensorAccount, collectors: ISwiftSensorCollector[], devices: ISwiftSensorDevice[], sensors: ISwiftSensorSensor[]) {
        this.workspaceId = workspaceId;
        this.data = data;
        this.account = account;
        this.collectors = collectors;
        this.devices = devices;
        this.sensors = sensors;
    }

    async getTreemapResponse(workspace: IWorkspace) {
        const settings: IIntegrationSettings | undefined = workspace?.settings?.integration.swiftSensors;
        const { apiKey, accessToken, accountId, tokenType }: any = settings;

        const url = `https://api.swiftsensors.net/api/client/v1/accounts/${accountId}/treemap`;

        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'Authorization': `${tokenType} ${accessToken}`
        }

        const treemapResponse = await axios.get(url, { headers });

        this.data = treemapResponse.data.treeMap;

        return treemapResponse;
    }

    static async initialize(workspaceId: string) {
        let data = null;
        let account: ISwiftSensorAccount | null = null;
        let collectors: ISwiftSensorCollector[] = [];
        let devices: ISwiftSensorDevice[] = [];
        let sensors: ISwiftSensorSensor[] = [];

        const workspace = await Workspace.findOne({ _id: workspaceId });

        const settings: IIntegrationSettings | undefined = workspace?.settings?.integration.swiftSensors;

        const { apiKey, accessToken, accountId, tokenType }: any = settings;

        const url = `https://api.swiftsensors.net/api/client/v1/accounts/${accountId}/treemap`;

        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'Authorization': `${tokenType} ${accessToken}`
        }

        try {
            const treemapResponse = await axios.get(url, { headers });

            if (treemapResponse.status === 200) {
                const treemap = treemapResponse.data.treeMap;
                data = treemap;

                for (const treemapItemId of Object.keys(treemap)) {
                    if (treemapItemId.startsWith('a')) {
                        account = treemap[treemapItemId]
                    }
                    if (treemapItemId.startsWith('c')) {
                        collectors.push(treemap[treemapItemId])
                    }
                    if (treemapItemId.startsWith('d')) {
                        devices.push(treemap[treemapItemId])
                    }
                    if (treemapItemId.startsWith('s')) {
                        sensors.push(treemap[treemapItemId])
                    }
                }
            }

            logger.info(`Treemap retrieved successfully.`)
            setActive(workspaceId);
            return new Treemap(workspaceId, data, account as ISwiftSensorAccount, collectors, devices, sensors);
        } catch (error: any) {
            logger.error(`Unable to get Swift Sensors treemap. ${error.message}`)
            io.emit(`integrations error ${workspaceId}`, { integrationType: 'Swift Sensors', errorMsg: `Unable to get Swift Sensors treemap. ${error.message}` });

            setInactive(workspaceId);

        } finally {
            return null;
        }
    }
}

export default Treemap;