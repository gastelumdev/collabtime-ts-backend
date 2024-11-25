import axios from "axios";
import Workspace from "../../../models/workspace.model";
import { IIntegrationSettings } from "../../../services/workspace.service";

class Threshold {
    #data: any;
    private constructor(data: any) {
        this.#data = data;
    }

    static async initialize(workspaceId: string, thresholdId: number) {
        try {
            const workspace = await Workspace.findOne({ _id: workspaceId });

            const settings: IIntegrationSettings | undefined = workspace?.settings?.integration.swiftSensors;

            const { apiKey, accessToken, accountId, tokenType }: any = settings;
            const url = `https://api.swiftsensors.net/api/client/v1/accounts/${accountId}/thresholds/${thresholdId}`;

            const headers = {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'Authorization': `${tokenType} ${accessToken}`
            }

            const thresholdResponse = await axios.get(url, { headers });

            return new Threshold(thresholdResponse.data);
        } catch (err) {
            return null;
        }
    }

    getData() {
        return this.#data;
    }
}

export default Threshold;