import type { Request, Response } from 'express';
export declare const getAllPlayer: (req: Request, res: Response) => Promise<void>;
export declare const getPlayerById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createPlayer: (req: Request, res: Response) => Promise<void>;
export declare const updatePlayer: (req: Request, res: Response) => Promise<void>;
export declare const deletePlayer: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=PlayerController.d.ts.map