"use client";

import { useEffect, useState } from "react";
import { Match } from "@/types/types";
import { X } from "lucide-react";


interface MatchData {
  title: string;
  location: string;
  courtNumber: string;
  date: string;
  time: string;
  fee: number;
  status: string;
  description?: string;
  playerIds?: string[];
}

interface NewMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (matchData: MatchData) => void;
  editingMatch?: Match | null;
}

interface MatchFormState {
  title: string;
  location: string;
  courtNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  fee: string;
  description: string;
  playerIds: string[];
}

const INITIAL_FORM_STATE: MatchFormState = {
  title: "",
  location: "",
  courtNumber: "",
  date: "",
  startTime: "00:00",
  endTime: "23:59",
  fee: "",
  description: "",
  playerIds: [],
};

const parseTimeRange = (timeRange: string) => {
  const [start, end] = timeRange.split("-").map((value) => value.trim());

  return {
    startTime: start || "00:00",
    endTime: end || "23:59",
  };
};

export default function NewMatchModal({
  isOpen,
  onClose,
  onSubmit,
  editingMatch,
}: NewMatchModalProps) {
  const [formData, setFormData] = useState<MatchFormState>(INITIAL_FORM_STATE);
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchPlayers = async () => {
        setIsLoadingPlayers(true);
        try {
          const { authFetch } = await import("@/lib/authFetch");
          const response = await authFetch("/api/players?latest=true");
          if (response.ok) {
            const data = await response.json();
            setAvailablePlayers(data);
          }
        } catch (error) {
          console.error("Error fetching players:", error);
        } finally {
          setIsLoadingPlayers(false);
        }
      };
      fetchPlayers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingMatch) {
      const { startTime, endTime } = parseTimeRange(editingMatch.time);
      const formattedDate = editingMatch.date
        ? new Date(editingMatch.date).toISOString().split("T")[0]
        : "";

      setFormData({
        title: editingMatch.title,
        location: editingMatch.location,
        courtNumber: editingMatch.courtNumber,
        date: formattedDate,
        startTime,
        endTime,
        fee: editingMatch.fee ? String(editingMatch.fee) : "",
        description: editingMatch.description ?? "",
        playerIds: editingMatch.players?.map((p) => p.player.id) ?? [],
      });
    } else {
      setFormData(INITIAL_FORM_STATE);
    }
  }, [editingMatch]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = formData.title.trim();
    const trimmedLocation = formData.location.trim();
    const trimmedCourtNumber = formData.courtNumber.trim();
    const trimmedDescription = formData.description.trim();
    const feeValue = Number.parseInt(formData.fee, 10);

    const matchData: MatchData = {
      title: trimmedTitle,
      location: trimmedLocation,
      courtNumber: trimmedCourtNumber,
      date: formData.date,
      time: `${formData.startTime}-${formData.endTime}`,
      fee: Number.isNaN(feeValue) ? 0 : feeValue,
      status: editingMatch?.status ?? "UPCOMING",
      description: trimmedDescription,
      playerIds: formData.playerIds,
    };

    onSubmit(matchData);
    setFormData(INITIAL_FORM_STATE);
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePlayerToggle = (playerId: string) => {
    setFormData((prev) => {
      const isSelected = prev.playerIds.includes(playerId);
      return {
        ...prev,
        playerIds: isSelected
          ? prev.playerIds.filter((id) => id !== playerId)
          : [...prev.playerIds, playerId],
      };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{editingMatch ? "Edit Match" : "Create New Match"}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close match form">
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Match title..."
              minLength={3}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Court location..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="courtNumber">Court #</label>
              <input
                type="text"
                id="courtNumber"
                name="courtNumber"
                value={formData.courtNumber}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Court number..."
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fee">Court Fee(s)</label>
              <input
                type="number"
                id="fee"
                name="fee"
                value={formData.fee}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Court fee..."
                min="0"
                step="1000"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="players-grid">Initial Players</label>
            <div id="players-grid" className="players-selection-grid">
              {isLoadingPlayers ? (
                <div className="loading-players">Loading players...</div>
              ) : availablePlayers.length === 0 ? (
                <div className="no-players">No players found.</div>
              ) : (
                availablePlayers.map((player) => (
                  <label key={player.id} className="player-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.playerIds.includes(player.id)}
                      onChange={() => handlePlayerToggle(player.id)}
                    />
                    <span>{player.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingMatch ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
