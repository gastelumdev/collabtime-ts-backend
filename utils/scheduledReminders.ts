import User from "../models/auth.model";
import Column from "../models/column.model";
import Row from "../models/row.models"
import sendEmail from "./sendEmail";

const checkDates = (reminder: string) => {
    const reminderDate = reminder.split("T")[0]
    const reminderTime = reminder.split("T")[1]
    const reminderHours = Number(reminderTime.split(":")[0])
    const reminderMinutes = Number(reminderTime.split(":")[1])
    const reminderSeconds = ((reminderHours * 60) * 60) + (reminderMinutes * 60)

    const now = new Date();
    const nowDate = now.toISOString().slice(0, 16).split("T")[0]
    const nowTime = now.toISOString().slice(0, 16).split("T")[1]
    const nowHours = Number(nowTime.split(":")[0]);
    const nowMinutes = Number(nowTime.split(":")[1]);
    const nowSeconds = (((nowHours - 7) * 60) * 60) + (nowMinutes * 60)

    console.log({ reminder, nowDate: now.toISOString() })
    console.log({ nowSeconds, reminderSeconds })

    if (reminderDate === nowDate) {
        console.log("TODAY IS THE DAY.");
        if (nowSeconds >= reminderSeconds) {
            return true;
        }
    }

    return false;

}

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

                    console.log(checkDates(reminder));

                    console.log({ reminder: reminderDate.getTime(), now: now.getTime() })
                    if (checkDates(reminder)) {
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
                                console.log({ columnName: column?.name });

                                // const newRow = await Row.findByIdAndUpdate(row._id, { $set: { reminders: newReminders } }, { new: true });
                                const newRow: any = await Row.findById(row._id);
                                newRow.reminders = newReminders;

                                newRow.save();
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