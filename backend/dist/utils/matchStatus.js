"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMatchStatuses = void 0;
const database_1 = __importDefault(require("./database"));
const getMatchEndTime = (date, timeRange) => {
    const [, endTime] = timeRange.split('-');
    const [endHour, endMin] = endTime.split(':').map(Number);
    const matchDate = new Date(date);
    matchDate.setHours(endHour, endMin, 0, 0);
    return matchDate;
};
const updateMatchStatuses = async () => {
    const now = new Date();
    const upcomingMatches = await database_1.default.match.findMany({
        where: { status: 'UPCOMING' },
        select: { id: true, date: true, time: true },
    });
    const updates = upcomingMatches
        .filter((match) => getMatchEndTime(match.date, match.time) < now)
        .map(({ id }) => database_1.default.match.update({
        where: { id },
        data: { status: 'COMPLETED' },
    }));
    if (updates.length > 0) {
        await database_1.default.$transaction(updates);
    }
    return updates.length;
};
exports.updateMatchStatuses = updateMatchStatuses;
//# sourceMappingURL=matchStatus.js.map