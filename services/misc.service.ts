
import { Response } from 'express';
import PDFDocument from 'pdfkit';

interface IAddress {
    line1: string;
    line2: string;
    line3: string;
}

interface IItem { qty: number; description: string; unitPrice: number }

export interface IPurchaseOrder {
    number: string;
    date: string;
    logo: string;
    companyAddress: IAddress;
    toAddress: { companyName: string; address: IAddress; };
    shipToAddress: { companyName: string; attn: string; address: IAddress; };
    comments: string;
    salesPerson: string;
    requisitioner: string;
    shippedVia: string;
    jobNumber: string;
    quoteNumber: string;
    customerNumber: string;
    items: IItem[];
    salesTax: number;
    shippingAndHandling: number | null;
}

export const generatePurchaseOrderPDF = (res: Response, po: IPurchaseOrder) => {
    // const doc = new PDFDocument({ bufferPages: true, font: 'Helvetica' });

    // const stream = res.writeHead(200, {
    //     'Content-Type': 'application/pdf',
    //     'Content-Disposition': `attachment;filename=purchase-order.pdf`,
    // });

    // doc.on('data', (chunk) => stream.write(chunk));
    // doc.on('end', () => stream.end());

    // let itemCount = po.items.length;

    // let currentX = 50;
    // let currentY = 50;

    // // Logo
    // doc.image(`assets/images/${po.logo}`, currentX, currentY, { scale: 0.1 })

    // currentX = 250;

    // // Title
    // doc.fontSize(20).font('Helvetica-Bold').fillColor('#5f5f65').text('PURCHASE ORDER', currentX, currentY, { width: 300, align: 'right' })

    // // Change font color
    // doc.fillColor('black');
    // doc.fontSize(9);

    // // PO number and date

    // doc.font('Helvetica').text(`PURCHASE ORDER # ${po.number}`, currentX, currentY + 25, { width: 300, align: 'right' });
    // doc.font('Helvetica').text(`DATE: ${po.date}`, currentX, currentY + 35, { width: 300, align: 'right' });

    // currentX = 50;

    // currentY = currentY + 30;

    // // Address
    // doc.font('Helvetica').text(po.companyAddress.line1, currentX, currentY, { width: 300, align: 'left' });
    // doc.text(po.companyAddress.line2, currentX, currentY + 12);
    // doc.text(po.companyAddress.line3, currentX, currentY + 24);

    // // currentX = currentX + 170;
    // currentY = currentY + 55;

    // // To
    // doc.font('Helvetica-Bold').text('TO:', currentX, currentY, { width: 300, align: 'left' });
    // doc.font('Helvetica').text(po.toAddress.companyName, currentX, currentY + 12);
    // doc.text(po.toAddress.address.line1, currentX, currentY + 24);
    // doc.text(po.toAddress.address.line2, currentX, currentY + 36);
    // doc.text(`Phone: ${po.toAddress.address.line3}`, currentX, currentY + 48);

    // currentX = currentX + 260;

    // // Ship To
    // doc.font('Helvetica-Bold').text('SHIP TO:', currentX, currentY, { width: 300, align: 'left' });
    // doc.font('Helvetica').text(po.shipToAddress.companyName, currentX, currentY + 12);
    // doc.text(`Attn: ${po.shipToAddress.attn}`, currentX, currentY + 24);
    // doc.text(po.shipToAddress.address.line1, currentX, currentY + 36);
    // doc.text(po.shipToAddress.address.line2, currentX, currentY + 48);
    // doc.text(`Phone: ${po.shipToAddress.address.line3}`, currentX, currentY + 60);

    // // Special comments and instructions
    // currentX = 50;
    // currentY = currentY + 90;
    // doc.font('Helvetica-Bold').text('COMMENTS OR SPECIAL INSTRUCTIONS:', currentX, currentY, { width: 300, align: 'left' });
    // doc.font('Helvetica').text(po.comments, currentX, currentY + 12);

    // let boxHeight = 20;

    // currentY = currentY + 60;

    // // Headers
    // const detailHeaders = [
    //     { name: 'SALESPERSON', width: 110 },
    //     { name: 'REQUISITIONER', width: 110 },
    //     { name: 'SHIPPED VIA', width: 80 },
    //     { name: 'JOB #', width: 70 },
    //     { name: 'QUOTE #', width: 70 },
    //     { name: 'CUSTOMER #', width: 80 }
    // ]

    // let currentWidth = 0;

    // for (let i = 0; i < detailHeaders.length; i++) {
    //     if (i === 0) {
    //         currentWidth = detailHeaders[i].width;
    //         doc.font('Helvetica-Bold').fontSize(8).text(detailHeaders[i].name, currentX, currentY + 6, { width: currentWidth, align: 'center' });
    //         doc.lineWidth(0.1).strokeColor('lightgray').rect(currentX, currentY, currentWidth, boxHeight).stroke();
    //     } else {
    //         currentX = currentX + currentWidth;
    //         currentWidth = detailHeaders[i].width
    //         doc.text(detailHeaders[i].name, currentX, currentY + 6, { width: currentWidth, align: 'center' });
    //         doc.rect(currentX, currentY, currentWidth, boxHeight).stroke();
    //     }
    // }

    // // Values
    // currentY = currentY + 20;
    // currentX = 50;
    // currentWidth = 110;
    // doc.font('Courier-Bold').text(po.salesPerson, currentX, currentY + 7, { width: currentWidth, align: 'center' });
    // doc.rect(currentX, currentY, currentWidth, boxHeight).stroke();

    // currentX = 50 + currentWidth;
    // currentWidth = 110
    // doc.text(po.requisitioner, currentX, currentY + 7, { width: currentWidth, align: 'center' });
    // doc.rect(currentX, currentY, currentWidth, boxHeight).stroke();

    // currentX = currentX + currentWidth;
    // currentWidth = 80
    // doc.text(po.shippedVia, currentX, currentY + 7, { width: currentWidth, align: 'center' });
    // doc.rect(currentX, currentY, currentWidth, boxHeight).stroke();

    // currentX = currentX + currentWidth;
    // currentWidth = 70
    // doc.text(po.jobNumber, currentX, currentY + 7, { width: currentWidth, align: 'center' });
    // doc.rect(currentX, currentY, currentWidth, boxHeight).stroke();

    // currentX = currentX + currentWidth;
    // currentWidth = 70
    // doc.text(po.quoteNumber, currentX, currentY + 7, { width: currentWidth, align: 'center' });
    // doc.rect(currentX, currentY, currentWidth, boxHeight).stroke();

    // currentX = currentX + currentWidth;
    // currentWidth = 80
    // doc.text(po.customerNumber, currentX, currentY + 7, { width: currentWidth, align: 'center' });
    // doc.rect(currentX, currentY, currentWidth, boxHeight).stroke();


    // currentY = currentY + 30;
    // currentX = 50;

    // currentWidth = 50;
    // doc.font('Helvetica-Bold').text('QTY', currentX, currentY + 7, { width: currentWidth, align: 'center' });
    // doc.rect(currentX, currentY, currentWidth, boxHeight).stroke();

    // currentX = 50 + currentWidth;
    // currentWidth = 330
    // doc.text('DESCRIPTION', currentX, currentY + 7, { width: currentWidth, align: 'center' });
    // doc.rect(currentX, currentY, currentWidth, boxHeight).stroke();

    // currentX = currentX + currentWidth;
    // currentWidth = 70
    // doc.text('UNIT PRICE', currentX, currentY + 7, { width: currentWidth, align: 'center' });
    // doc.rect(currentX, currentY, currentWidth, boxHeight).stroke();

    // currentX = currentX + currentWidth;
    // currentWidth = 70
    // doc.text('TOTAL', currentX, currentY + 7, { width: currentWidth, align: 'center' });
    // doc.rect(currentX, currentY, currentWidth, boxHeight).stroke();

    // boxHeight = 20
    // let subtotal = 0;
    // let total = 0;

    // for (let i = 0; i < itemCount; i++) {
    //     currentY = currentY + boxHeight;
    //     currentX = 50;

    //     const data: IItem = po.items[i];

    //     currentWidth = 50;
    //     doc.font('Courier-Bold').text(data ? data.qty.toString() : '', currentX, currentY + 7, { width: currentWidth, align: 'center' });
    //     doc.lineWidth(0.1).strokeColor('lightgray').rect(currentX, currentY, currentWidth, boxHeight).stroke();

    //     currentX = 50 + currentWidth;
    //     currentWidth = 330
    //     doc.text(data ? data.description.toString() : '', currentX, currentY + 7, { width: currentWidth, align: 'center' });
    //     doc.rect(currentX, currentY, currentWidth, boxHeight).stroke();

    //     currentX = currentX + currentWidth;
    //     currentWidth = 70
    //     doc.font('Helvetica').text(`$${data ? data.unitPrice.toFixed(2).toString() : ''}`, currentX - 7, currentY + 7, { width: currentWidth, align: 'right' });
    //     doc.rect(currentX, currentY, currentWidth, boxHeight).stroke();

    //     currentX = currentX + currentWidth;
    //     currentWidth = 70
    //     doc.text(`$${data ? (data.qty * data.unitPrice).toFixed(2).toString() : ''}`, currentX - 7, currentY + 7, { width: currentWidth, align: 'right' });
    //     doc.rect(currentX, currentY, currentWidth, boxHeight).stroke();

    //     subtotal += data.qty * data.unitPrice;

    //     if (i == 14) {
    //         doc.addPage()
    //         currentY = 50;
    //         doc.font('Courier-Bold').lineWidth(0.1).strokeColor('lightgray')
    //     }
    // }

    // currentY = currentY + boxHeight;
    // // currentX = 50;
    // currentX = currentX - 305;

    // currentWidth = 300;
    // doc.font('Helvetica-Bold').text('SUBTOTAL', currentX, currentY + 7, { width: currentWidth, align: 'right' });
    // currentX = currentX + 305;
    // currentWidth = 70;
    // doc.font('Helvetica-Bold').text(`$${subtotal.toFixed(2).toString()}`, currentX - 7, currentY + 7, { width: currentWidth, align: 'right' });
    // doc.rect(currentX, currentY, currentWidth, boxHeight).stroke();

    // currentY = currentY + boxHeight;
    // currentX = currentX - 305;

    // currentWidth = 300;
    // doc.font('Helvetica').text('SALES TAX', currentX, currentY + 7, { width: currentWidth, align: 'right' });
    // currentX = currentX + 305;
    // currentWidth = 70;
    // doc.font('Helvetica').text(`$${po.salesTax.toFixed(2).toString()}`, currentX - 7, currentY + 7, { width: currentWidth, align: 'right' });
    // doc.rect(currentX, currentY, currentWidth, boxHeight).stroke();

    // currentY = currentY + boxHeight;
    // currentX = currentX - 305;

    // currentWidth = 300;
    // doc.font('Helvetica').text('SHIPPING & HANDLING', currentX, currentY + 7, { width: currentWidth, align: 'right' });
    // currentX = currentX + 305;
    // currentWidth = 70;
    // doc.font('Helvetica').text(po.shippingAndHandling !== null ? `$${po.shippingAndHandling.toFixed(2).toString()}` : 'TBD', currentX - 7, currentY + 7, { width: currentWidth, align: 'right' });
    // doc.rect(currentX, currentY, currentWidth, boxHeight).stroke();

    // currentY = currentY + boxHeight;
    // currentX = currentX - 305;

    // currentWidth = 300;
    // doc.font('Helvetica-Bold').text('TOTAL DUE', currentX, currentY + 7, { width: currentWidth, align: 'right' });
    // currentX = currentX + 305;
    // currentWidth = 70;
    // doc.font('Helvetica-Bold').text(`$${(subtotal + po.salesTax + (po.shippingAndHandling !== null ? po.shippingAndHandling : 0)).toString()}`, currentX - 7, currentY + 7, { width: currentWidth, align: 'right' });
    // doc.rect(currentX, currentY, currentWidth, boxHeight).stroke();



    // currentWidth = 520;
    // currentX = 50;
    // currentY = currentY + 40;
    // doc.font('Helvetica').fontSize(10).fillColor('gray').text('If you have any questions regarding this PO, contact Carlos Torres, 626.348.7963, Email: c_torres@environmentalautomation.com', currentX, currentY + 7, { width: currentWidth, align: 'center' });

    // currentY = currentY + 36;
    // doc.font('Helvetica-Bold').text('THANK YOU!', currentX, currentY, { width: currentWidth, align: 'center' });



    // doc.end();
}