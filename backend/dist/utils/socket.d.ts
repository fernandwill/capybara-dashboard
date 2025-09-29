import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
export declare const initSocket: (server: HttpServer) => Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare const getIO: () => Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare const hasSocketInstance: () => boolean;
//# sourceMappingURL=socket.d.ts.map