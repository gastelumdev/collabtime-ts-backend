import axios from "axios";
import { IWorkspace, IWorkspaceSettings } from "../../../services/workspace.service";
import Workspace from "../../../models/workspace.model";



class SwiftSensorsAPIAuth {
    async signin(workspaceId: string, settings: IWorkspaceSettings) {
        const integrationSwiftSensorSettings = settings.integration.swiftSensors;
        const url = `https://api.swiftsensors.net/api/client/v1/sign-in`;

        const requestData = {
            email: integrationSwiftSensorSettings.email,
            password: integrationSwiftSensorSettings.password,
            language: 'en'
        }

        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': integrationSwiftSensorSettings.apiKey,
        }

        try {
            const signinResponse = await axios.post(url, requestData, { headers });

            if (signinResponse.status === 200) {
                const signinData: { access_token: string; expires_in: number; token_type: string; refresh_token: string; session_id: string; account_id: string } = signinResponse.data;

                settings.integration.swiftSensors.accessToken = signinData.access_token;
                settings.integration.swiftSensors.expiresIn = signinData.expires_in;
                settings.integration.swiftSensors.tokenType = signinData.token_type;
                settings.integration.swiftSensors.refreshToken = signinData.refresh_token;
                settings.integration.swiftSensors.sessionId = signinData.session_id;

                const updatedWorkspace = await Workspace.findByIdAndUpdate(workspaceId, { settings }, { new: true })
            }
        } catch (error) {
            console.log(error)
        }
    }

    async refresh(workspaceId: string) {
        const url = "https://api.swiftsensors.net/api/token/v2/refresh";
        const workspace = await Workspace.findOne({ _id: workspaceId });

        const settings = workspace?.settings?.integration.swiftSensors;
        const requestData = settings?.refreshToken;

        const headers = {
            'Content-Type': 'text/plain',
            'x-api-key': settings?.apiKey,
            'Authorization': `${settings?.tokenType} ${settings?.accessToken}`,
        }

        try {
            const signinResponse = await axios.post(url, requestData, { headers });

            if (signinResponse.status === 200) {
                const signinData: {
                    access_token: string;
                    expires_in: number;
                    token_type: string;
                    refresh_token: string;
                    session_id: string;
                    account_id: string
                } = signinResponse.data;

                const newSettings = { ...workspace?.settings, integration: { ...workspace?.settings?.integration, swiftSensors: { ...settings, accessToken: signinData.access_token, expiresIn: signinData.expires_in, tokenType: signinData.token_type, refreshToken: signinData.refresh_token, sessionId: signinData.session_id } } }

                const updatedWorkspace = await Workspace.findByIdAndUpdate(workspaceId, { settings: newSettings }, { new: true });
                console.log({ updatedWorkspace })
            }
        } catch (error) {
            console.log(error)
        }
    }

    async refreshAll() {
        const workspaces = await Workspace.find({ type: 'integration' });

        for (const workspace of workspaces) {
            this.refresh(workspace._id);
        }
    }
}

export default SwiftSensorsAPIAuth;