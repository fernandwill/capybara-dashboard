import prisma from "../utils/database";
import { Request, Response } from "express";
import { updateStatus } from "../server";
import { calculateDurationHours } from "../utils/time";
import {io} from '../server';

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

    await updateStatus();
    io.emit('matchUpdated');

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

export const getPlayersFromPastMatches = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    
    // First, get the current match to know its date
    const currentMatch = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!currentMatch) {
      return res.status(404).json({ error: "Match not found." });
    }

    // Get the 3 most recent matches before the current match date
    const pastMatches = await prisma.match.findMany({
      where: {
        date: {
          lt: currentMatch.date,
        },
        status: "COMPLETED",
      },
      orderBy: {
        date: "desc",
      },
      take: 3,
      include: {
        players: {
          include: {
            player: true,
          },
        },
      },
    });

    // Extract unique players from past matches
    const playerMap = new Map();
    pastMatches.forEach(match => {
      match.players.forEach(playerMatch => {
        // Only add if not already in the map (to ensure uniqueness)
        if (!playerMap.has(playerMatch.player.id)) {
          playerMap.set(playerMatch.player.id, playerMatch.player);
        }
      });
    });

    // Convert map values to array
    const uniquePlayers = Array.from(playerMap.values());

    res.json(uniquePlayers);
  } catch (error) {
    console.error("Error fetching players from past matches:", error);
    res.status(500).json({ error: "Failed to fetch players from past matches." });
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
      const durationHours = calculateDurationHours(match.time);
      if (durationHours !== null) {
        totalHours += durationHours;
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