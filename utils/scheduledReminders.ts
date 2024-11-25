import { io } from "..";
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

    if (reminderDate === nowDate) {
        if (nowSeconds >= reminderSeconds) {
            return true;
        }
    }

    return false;

}

const scheduleReminders = async () => {
    try {
        const rows = await Row.find({ reminder: true });
        for (const row of rows) {
            const column = await Column.findOne({ dataCollection: row.dataCollection, position: 1 });
            if (row.reminders.length > 0) {
                for (const reminder of row.reminders) {
                    const reminderDate = new Date(reminder.date);
                    const now = new Date();
                    if (checkDates(reminder.date)) {
                        if (row.values.assigned_to !== undefined) {
                            for (const assignee of row.values.assigned_to) {
                                const email = assignee.email;
                                const user = await User.find({ email });

                                io.emit((user as any)?._id || "", { message: `Reminder: ${reminder.title} from task "${row.values[column?.name as string]}"` });
                                io.emit("update row", { message: "" });

                                sendEmail({
                                    email,
                                    subject: `Collabtime Reminder`,
                                    payload: { name: row.values[column?.name as string], reminder: reminder.date.split("T").join(" "), title: reminder.title, comments: reminder.comments },
                                    template: "./template/singleReminder.handlebars"
                                }, async (res: Response) => {
                                    const newReminders = row.reminders.filter((rem) => {
                                        return rem.date !== reminder.date;
                                    });

                                    // const newRow = await Row.findByIdAndUpdate(row._id, { $set: { reminders: newReminders } }, { new: true });
                                    const newRow: any = { ...row, reminder: newReminders.length > 0, reminders: newReminders };
                                    const updatedRow = await Row.findByIdAndUpdate(row._id, { reminders: newRow.reminders, reminder: newRow.reminder }, { new: true });
                                })
                            }

                        }
                    }
                }
            }
        }
    } catch (err) {
    }
}

export default scheduleReminders;