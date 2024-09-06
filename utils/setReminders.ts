import User from "../models/auth.model";
import DataCollection from "../models/dataCollection.model";
import Row from "../models/row.models";
import Workspace from "../models/workspace.model";
import sendEmail from "./sendEmail";

const setReminders = async () => {
    try {

        const users = await User.find({});

        for (const user of users) {
            const tasks = [];
            for (const workspaceObj of user.workspaces) {
                const workspace = await Workspace.findOne({ _id: workspaceObj.id });
                const dataCollections = await DataCollection.find({ workspace: workspaceObj.id });


                for (const dataCollection of dataCollections) {
                    const rows = await Row.find({ dataCollection: dataCollection._id, reminder: true, complete: false });
                    const pendingRows = []

                    for (const row of rows) {
                        if (row.values["assigned_to"] !== undefined) {
                            const email = row.values["assigned_to"].email;
                            if (email === user?.email) {
                                pendingRows.push(row);
                            }
                        }
                    }

                    if (pendingRows.length > 0) {
                        tasks.push({
                            workspaceName: workspace?.name,
                            dataCollectionName: dataCollection.name,
                            numberOfRows: String(pendingRows.length),
                            url: `${process.env.CLIENT_URL || "http://localhost:5173"}/workspaces/${workspace?._id}/dataCollections/${dataCollection?._id}`
                        })
                    }

                }
            }


            if (tasks.length > 0) {
                console.log("NAME", user.firstname)
                console.log("TASKS", tasks)

                sendEmail({
                    email: user?.email || "",
                    subject: `Collabtime - Here is a friendly reminder of your day ahead.`,
                    payload: { tasks: tasks },
                    template: "./template/dailyReminders.handlebars",
                }, (res: Response) => console.log("Email sent."));
            }
        }

    } catch (error) {
        console.log(error);
    }
}

export default setReminders;