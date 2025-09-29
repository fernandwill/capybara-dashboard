import type { Request, Response } from "express";
export declare const getAllMatches: (req: Request, res: Response) => Promise<void>;
export declare const getMatchById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createMatch: (req: Request, res: Response) => Promise<void>;
export declare const updateMatch: (req: Request, res: Response) => Promise<void>;
export declare const deleteMatch: (req: Request, res: Response) => Promise<void>;
export declare const addPlayerToMatch: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const removePlayerFromMatch: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPlayersFromPastMatches: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getStats: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=MatchController.d.ts.map