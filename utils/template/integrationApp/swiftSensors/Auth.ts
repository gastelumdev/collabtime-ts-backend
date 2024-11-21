import axios from "axios";
import { IWorkspace, IWorkspaceSettings } from "../../../../services/workspace.service";
import Workspace from "../../../../models/workspace.model";

const settings: IWorkspaceSettings = {
    integration: {
        swiftSensors: {
            type: "Swift Sensors",
            apiKey: "ho0cfvh4grq5g4i4lj52krft0o0sq87e",
            email: "ogastelum@environmentalautomation.com",
            password: "Queenbee24*!",
            accessToken: null,
            expiresIn: null,
            tokenType: null,
            refreshToken: null,
            sessionId: null,
            accountId: ".2316.",
        }
    }
}
const workspaceId = "673b87f6299c04ead15cc3b0";
const dataCollectionId = "673d2be015a038c6d24b53d4";

class Auth {
    async signin(workspaceId: IWorkspace, settings: IWorkspaceSettings) {
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

    async refresh(workspaceId: IWorkspace) {

    }
}