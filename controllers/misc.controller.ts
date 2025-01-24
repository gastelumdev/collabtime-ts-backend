import { Request, Response } from "express";
import { generatePurchaseOrderPDF } from "../services/misc.service";

export const purchaseOrder = (req: Request, res: Response) => {
    // generatePurchaseOrderPDF(res, {
    //     number: 'EA10013',
    //     date: '11/6/2024',
    //     logo: 'ea-logo.png',
    //     companyAddress: { line1: '5351 Alhambra Ave.', line2: 'Los Angeles, CA 90032', line3: '(323) 332-2125' },
    //     toAddress: { companyName: 'Wesco', address: { line1: '2301 Patriot Blvd.', line2: 'Glenview, IL 60026-8020', line3: 'Phone' } },
    //     shipToAddress: { companyName: 'Environmental Automation', attn: 'Carlos Torres', address: { line1: '5351 Alhambra Ave.', line2: 'Los Angeles, CA 90032', line3: '(323) 332-2125' } },
    //     comments: 'Comments sample',
    //     salesPerson: 'Kristin Benda',
    //     requisitioner: 'Carlos Torres',
    //     shippedVia: 'UPS 3-Day',
    //     jobNumber: '4224-008',
    //     quoteNumber: 'Q00D76J1',
    //     customerNumber: '525823',
    //     items: [
    //         { qty: 2, description: '10277636 AXIS COMM 02374-001 M3086- V INDOOR FIXED MINI DOME4 MP', unitPrice: 358.05 },
    //         { qty: 3, description: '10277636 AXIS COMM 02374-001 M3086- V INDOOR FIXED MINI DOME4 MP', unitPrice: 358.05 }
    //     ],
    //     salesTax: 34.01,
    //     shippingAndHandling: 30
    // })

    res.send('Purchase order generated');
}