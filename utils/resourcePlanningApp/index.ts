import Row from "../../models/row.models";
import { IDataCollection } from "../../services/dataCollection.service";
import { IRow } from "../../services/row.service";
import { IWorkspace } from "../../services/workspace.service";
import Logger from "../logger/Logger";

const logger = new Logger()

export const handleResourcePlanningAppValueChange = async (row: IRow & { _id: string }, reqbody: IRow & { _id: string }, workspace: IWorkspace & { _id: string }, dataCollection: IDataCollection & { _id: string }) => {
    try {
        let updatedRow = null;
        if (reqbody.values.proposal_status === 'Rejected' || reqbody.values.project_status === 'Completed') {
            updatedRow = await Row.findByIdAndUpdate(reqbody._id, { archived: true }, { new: true });
            logger.info(`Row '${updatedRow?._id}' in data collection ${dataCollection._id} was archived`)
        }
        else {
            updatedRow = await Row.findByIdAndUpdate(reqbody._id, { archived: false }, { new: true });
            logger.info(`Row '${updatedRow?._id}' in data collection ${dataCollection._id} was restored from being archived`);
        }
    } catch (error) {
        logger.error(`Row '${row?._id}' in data collection ${dataCollection._id} encountered an error when checking if project status was completed or rejected for archiving`)
    }


    if (reqbody.values.proposal_status === 'Approved') {
        const now = new Date();
        const newTime = now.getTime() - (8 * 60 * 60 * 1000);
        const newDate = new Date(newTime);

        let jobNumber = await handleDefaultJobNumbers(reqbody.values.job_type, dataCollection?._id);

        const updatedRow = await Row.findByIdAndUpdate(reqbody._id, { values: { ...reqbody.values, date_approved: newDate, job_number: jobNumber } })
    }
}

export const handleDefaultJobNumbers = async (type: string, dataCollectionId: string) => {
    const codeMap: any = { Construction: '41', Negotiated: '42', "Service Agreement": '44', Parts: '46' };
    const now = new Date();
    const year = now.getFullYear() - 2000;

    const rows = await Row.find({ dataCollection: dataCollectionId });
    let jobNumber = null;

    for (const codeMapKey of Object.keys(codeMap)) {
        const codeMapValue = codeMap[codeMapKey]

        if (type === codeMapKey) {
            const negotiatedRows = rows.filter((item: IRow) => {
                if (item.values.job_number) {
                    return item.values.job_number.startsWith(codeMapValue);
                }
                return false;

            });
            if (negotiatedRows.length === 0) {
                jobNumber = `${codeMapValue}${year}-001`;
            } else {
                const lastRow = negotiatedRows[negotiatedRows.length - 1];
                const lastRowJobNumber = lastRow.values.job_number;
                const numberToIncrement = lastRowJobNumber.split("-")[1];
                jobNumber = createPrimaryValuesForJobNumber(Number(numberToIncrement) + 1, `${codeMapValue}${year}`)
            }

            return jobNumber;
        }
    }
    return jobNumber;
}

export const createPrimaryValuesForJobNumber = (i: number, identifier: string) => {
    let leadingZeroes = ""
    if (i >= 100) {
        leadingZeroes = ""
    } else if (i >= 10 && i < 100) {
        leadingZeroes = "0"
    } else {
        leadingZeroes = "00"
    }

    return `${identifier}-${leadingZeroes}${i}`;
}