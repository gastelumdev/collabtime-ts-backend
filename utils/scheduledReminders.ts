import User from "../models/auth.model";
import Row from "../models/row.models"
import sendEmail from "./sendEmail";

const scheduleReminders = async () => {
    try {
        const rows = await Row.find({});

        for (const row of rows) {
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
                                payload: { name: row.values.task },
                                template: "./template/singleReminder.handlebars"
                            }, async (res: Response) => {
                                const newReminders = row.reminders.filter((rem) => {
                                    return rem !== reminder;
                                });

                                console.log(newReminders);

                                await Row.findByIdAndUpdate(row._id, { $set: { reminders: newReminders } }, { new: true });
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