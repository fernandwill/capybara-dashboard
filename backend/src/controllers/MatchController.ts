import prisma from "../utils/database";
import { Request, Response } from "express";

export const getAllMatches = async (req: Request, res: Response) => {
  try {
    const matches = await prisma.match.findMany({
      include: {
        players: {
          include: {
            player: true,
          },
        },
        payments: true,
      },
      orderBy: {
        date: "asc",
      },
    });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: "Failed to find matches." });
  }
};

export const getMatchById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            player: true,
          },
        },
        payments: true,
      },
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found." });
    }

    res.json(match);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch match." });
  }
};

export const createMatch = async (req: Request, res: Response) => {
  try {
    const {
      title,
      location,
      courtNumber,
      date,
      time,
      fee = 0,
      status = "UPCOMING",
      description,
    } = req.body;

    const match = await prisma.match.create({
      data: {
        title,
        location,
        courtNumber,
        date: new Date(date),
        time,
        fee,
        status,
        description,
      },
      include: {
        players: {
          include: {
            player: true,
          },
        },
        payments: true,
      },
    });

    res.status(201).json(match);
  } catch (error) {
    res.status(500).json({ error: "Failed to create match." });
  }
};

export const updateMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      location,
      courtNumber,
      date,
      time,
      fee,
      status,
      description,
    } = req.body;

    const match = await prisma.match.update({
      where: { id },
      data: {
        title,
        location,
        courtNumber,
        date: date ? new Date(date) : undefined,
        time,
        fee,
        status,
        description,
      },
      include: {
        players: {
          include: {
            player: true,
          },
        },
        payments: true,
      },
    });

    res.json(match);
  } catch (error) {
    res.status(500).json({ error: "Failed to update match." });
  }
};

export const deleteMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.match.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete match." });
  }
};

export const addPlayerToMatch = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { playerId } = req.body;

    // Check if player is already in this match
    const existingMatchPlayer = await prisma.matchPlayer.findUnique({
      where: {
        matchId_playerId: {
          matchId,
          playerId,
        },
      },
    });

    if (existingMatchPlayer) {
      return res
        .status(400)
        .json({ error: "Player is already in this match." });
    }

    const matchPlayer = await prisma.matchPlayer.create({
      data: {
        matchId,
        playerId,
      },
      include: {
        player: true,
        match: true,
      },
    });

    res.status(201).json(matchPlayer);
  } catch (error) {
    res.status(500).json({ error: "Failed to add player to match." });
  }
};

export const removePlayerFromMatch = async (req: Request, res: Response) => {
  try {
    const { matchId, playerId } = req.params;

    // Check if the player is actually in this match
    const existingMatchPlayer = await prisma.matchPlayer.findUnique({
      where: {
        matchId_playerId: {
          matchId,
          playerId,
        },
      },
    });

    if (!existingMatchPlayer) {
      return res.status(404).json({ error: "Player is not in this match." });
    }

    await prisma.matchPlayer.delete({
      where: {
        matchId_playerId: {
          matchId,
          playerId,
        },
      },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to remove player from match." });
  }
};
export const getStats = async (req: Request, res: Response) => {
  try {
    const totalMatches = await prisma.match.count();

    const upcomingMatches = await prisma.match.count({
      where: {
        status: "UPCOMING",
      },
    });

    const completedMatches = await prisma.match.count({
      where: {
        status: "COMPLETED",
      },
    });

    // Calculate total hours played for completed matches
    const completedMatchesWithTime = await prisma.match.findMany({
      where: {
        status: "COMPLETED",
      },
      select: {
        time: true,
      },
    });

    let totalHours = 0;
    completedMatchesWithTime.forEach((match) => {
      // Assuming time format is "HH:MM-HH:MM" like "16:00-20:00"
      if (match.time && match.time.includes("-")) {
        const [startTime, endTime] = match.time.split("-");
        const [startHour, startMin] = startTime.split(":").map(Number);
        const [endHour, endMin] = endTime.split(":").map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        const durationMinutes = endMinutes - startMinutes;

        totalHours += durationMinutes / 60;
      }
    });

    res.json({
      totalMatches,
      upcomingMatches,
      completedMatches,
      hoursPlayed: totalHours.toFixed(1),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};
