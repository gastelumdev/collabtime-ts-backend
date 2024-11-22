import axios from "axios";
import DataCollection from "../../../models/dataCollection.model";
import Workspace from "../../../models/workspace.model";
import { IIntegrationSettings, IWorkspace } from "../../../services/workspace.service";

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

        console.log(settings)

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
        const dataCollection = await DataCollection.findOne({ workspace: workspaceId, name: 'Devices' });
        const dataCollectionId = dataCollection?._id;

        const settings: IIntegrationSettings | undefined = workspace?.settings?.integration.swiftSensors;

        console.log(settings)

        const { apiKey, accessToken, accountId, tokenType }: any = settings;

        const url = `https://api.swiftsensors.net/api/client/v1/accounts/${accountId}/treemap`;

        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'Authorization': `${tokenType} ${accessToken}`
        }

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

        return new Treemap(workspaceId, data, account as ISwiftSensorAccount, collectors, devices, sensors);
    }
}

export default Treemap;