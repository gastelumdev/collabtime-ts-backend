import User from "../models/auth.model";
import Column from "../models/column.model";
import Row from "../models/row.models"
import sendEmail from "./sendEmail";

const scheduleReminders = async () => {
    console.log("Running Scheduled Reminders")
    try {
        const rows = await Row.find({ reminders: { $exists: true, $ne: [] } });

        console.log(rows)
        for (const row of rows) {
            const column = await Column.findOne({ dataCollection: row.dataCollection, position: 1 });
            if (row.reminders.length > 0) {
                for (const reminder of row.reminders) {
                    const reminderDate = new Date(reminder);
                    const now = new Date();

                    console.log({ reminder: reminderDate.getTime(), now: now.getTime() })
                    if (reminderDate.getTime() < now.getTime()) {
                        console.log("Send email")
                        if (row.values.assigned_to !== undefined) {
                            const email = row.values.assigned_to.split(" - ")[1];

                            sendEmail({
                                email,
                                subject: `Collabtime Reminder`,
                                payload: { name: row.values[column?.name as string], reminder: reminder.split("T").join(" ") },
                                template: "./template/singleReminder.handlebars"
                            }, async (res: Response) => {
                                const newReminders = row.reminders.filter((rem) => {
                                    return rem !== reminder;
                                });

                                console.log({ newReminders });

                                const newRow = await Row.findByIdAndUpdate(row._id, { $set: { reminders: newReminders } }, { new: true });
                                console.log({ newRow })
                            })
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.log(err);
    }
}

export default scheduleReminders;