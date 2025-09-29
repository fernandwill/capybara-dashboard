import type { Request, Response } from 'express';
export declare const getPayment: (req: Request, res: Response) => Promise<void>;
export declare const getPaymentById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createPayment: (req: Request, res: Response) => Promise<void>;
export declare const updatePayment: (req: Request, res: Response) => Promise<void>;
export declare const deletePayment: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=PaymentController.d.ts.map