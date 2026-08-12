"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Match } from "@/types/types";
import Modal from "./ui/Modal";
import SelectPlayersModal, {
  PlayerOption,
  getAvatarGradient,
  getInitials,
} from "./SelectPlayersModal";
import {
  Calendar,
  Clock,
  Loader2,
  Minus,
  Plus,
  UserPlus,
  X,
} from "lucide-react";

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
  isSubmitting?: boolean;
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
  courtNumber: "1",
  date: "",
  startTime: "19:00",
  endTime: "21:00",
  fee: "",
  description: "",
  playerIds: [],
};

const parseTimeRange = (timeRange: string) => {
  const [start, end] = timeRange.split("-").map((value) => value.trim());

  return {
    startTime: start || "19:00",
    endTime: end || "21:00",
  };
};

export default function NewMatchModal({
  isOpen,
  onClose,
  onSubmit,
  editingMatch,
  isSubmitting = false,
}: NewMatchModalProps) {
  const [formData, setFormData] = useState<MatchFormState>(INITIAL_FORM_STATE);
  const [availablePlayers, setAvailablePlayers] = useState<PlayerOption[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [isPlayerPickerOpen, setIsPlayerPickerOpen] = useState(false);
  const submittingRef = useRef(false);

  // Block closing the modal while a create/update request is in flight
  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  // Keep the ref in sync so a fast double-click can't fire two submits
  useEffect(() => {
    submittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    if (isOpen) {
      // Reset the form and double-submit guard whenever the modal opens
      // (editing data is applied afterwards by the editingMatch effect)
      setFormData(INITIAL_FORM_STATE);
      submittingRef.current = false;
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
    } else {
      setIsPlayerPickerOpen(false);
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
        courtNumber: editingMatch.courtNumber || "1",
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

  const selectedPlayersList = useMemo(() => {
    return formData.playerIds
      .map((id) => availablePlayers.find((p) => p.id === id))
      .filter((p): p is PlayerOption => Boolean(p));
  }, [formData.playerIds, availablePlayers]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Prevent duplicate submissions while a request is in flight.
    // Flip the ref immediately (before the parent's isSubmitting prop lands)
    // so even a same-tick double click can't fire twice.
    if (submittingRef.current) return;
    submittingRef.current = true;

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

    // The form is NOT reset here so the entered values stay visible while
    // the request is in flight (and survive an error). It resets on next open.
    onSubmit(matchData);
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

  const handleRemovePlayerChip = (playerId: string) => {
    setFormData((prev) => ({
      ...prev,
      playerIds: prev.playerIds.filter((id) => id !== playerId),
    }));
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={editingMatch ? "Edit Match" : "Create New Match"}
        subtitle="Schedule a match and track your game."
        size="xl"
        footer={
          <>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-match-form"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  {editingMatch ? "Updating..." : "Creating..."}
                </>
              ) : editingMatch ? (
                "Update Match"
              ) : (
                "Create Match"
              )}
            </button>
          </>
        }
      >
        <form id="new-match-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Section: MATCH DETAILS */}
          <div>
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              MATCH DETAILS
            </h3>

            {/* Title */}
            <div className="mb-3">
              <label htmlFor="title" className="mb-1.5 block text-xs font-medium text-gray-300">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Match title..."
                minLength={3}
                className="w-full rounded-lg border border-[#232730] bg-[#0c0e12] px-3.5 py-2 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Location & Court # */}
            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="location" className="mb-1.5 block text-xs font-medium text-gray-300">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="Court location..."
                  className="w-full rounded-lg border border-[#232730] bg-[#0c0e12] px-3.5 py-2 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label htmlFor="courtNumber" className="mb-1.5 block text-xs font-medium text-gray-300">
                  Court #
                </label>
                <div className="flex items-center rounded-lg border border-[#232730] bg-[#0c0e12] transition-colors focus-within:border-blue-500">
                  <button
                    type="button"
                    onClick={() => {
                      const current = Number.parseInt(formData.courtNumber, 10) || 1;
                      setFormData((prev) => ({
                        ...prev,
                        courtNumber: String(Math.max(1, current - 1)),
                      }));
                    }}
                    className="px-3 py-2 text-gray-400 hover:text-white transition-colors"
                    aria-label="Decrease court number"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    id="courtNumber"
                    name="courtNumber"
                    min="1"
                    value={formData.courtNumber}
                    onChange={handleChange}
                    placeholder="1"
                    required
                    className="w-full bg-transparent py-2 text-center text-sm text-white placeholder:text-gray-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const current = Number.parseInt(formData.courtNumber, 10) || 0;
                      setFormData((prev) => ({
                        ...prev,
                        courtNumber: String(current + 1),
                      }));
                    }}
                    className="px-3 py-2 text-gray-400 hover:text-white transition-colors"
                    aria-label="Increase court number"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Date & Start Time */}
            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="date" className="mb-1.5 block text-xs font-medium text-gray-300">
                  Date
                </label>
                <div className="relative">
                  <Calendar
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-[#232730] bg-[#0c0e12] py-2 pl-9 pr-3.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="startTime" className="mb-1.5 block text-xs font-medium text-gray-300">
                  Start Time
                </label>
                <div className="relative">
                  <Clock
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-[#232730] bg-[#0c0e12] py-2 pl-9 pr-3.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* End Time & Court Fee (Rp) */}
            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="endTime" className="mb-1.5 block text-xs font-medium text-gray-300">
                  End Time
                </label>
                <div className="relative">
                  <Clock
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-[#232730] bg-[#0c0e12] py-2 pl-9 pr-3.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="fee" className="mb-1.5 block text-xs font-medium text-gray-300">
                  Court Fee (Rp)
                </label>
                <input
                  type="number"
                  id="fee"
                  name="fee"
                  value={formData.fee}
                  onChange={handleChange}
                  required
                  placeholder="50,000"
                  min="0"
                  step="1000"
                  className="w-full rounded-lg border border-[#232730] bg-[#0c0e12] px-3.5 py-2 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Description (optional) */}
            <div className="mb-3">
              <label htmlFor="description" className="mb-1.5 block text-xs font-medium text-gray-300">
                Description (optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Add any notes about this match..."
                className="w-full rounded-lg border border-[#232730] bg-[#0c0e12] px-3.5 py-2 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>

          {/* Section: PLAYERS */}
          {editingMatch?.status?.toUpperCase() !== "COMPLETED" && (
            <div>
              {formData.playerIds.length === 0 ? (
                /* State 1: Clean empty state with Add Players CTA */
                <div>
                  <div className="mb-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      PLAYERS
                    </h3>
                    <p className="text-xs text-gray-400">
                      Add players to this match.
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#232730] bg-[#0c0e12]/60 p-6 text-center">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                      <UserPlus size={20} />
                    </div>
                    <p className="text-sm font-semibold text-white">
                      No players added yet
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      Add players to get started.
                    </p>
                    <button
                      type="button"
                      disabled={isLoadingPlayers}
                      onClick={() => setIsPlayerPickerOpen(true)}
                      className="mt-3.5 flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 transition hover:border-blue-500/50 hover:bg-blue-500/20 disabled:opacity-50"
                    >
                      <Plus size={14} />
                      <span>Add Players</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* State 2: Selected players chips with quick removal and Add More */
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        PLAYERS
                      </h3>
                      <p className="text-xs font-semibold text-emerald-400">
                        {formData.playerIds.length} player
                        {formData.playerIds.length === 1 ? "" : "s"} added
                      </p>
                    </div>
                  </div>

                  {/* Chips Grid */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {selectedPlayersList.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between rounded-xl border border-[#232730] bg-[#0c0e12] px-3 py-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm ${getAvatarGradient(player.name)}`}
                          >
                            {getInitials(player.name)}
                          </div>
                          <span className="truncate text-xs font-semibold text-white">
                            {player.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRemovePlayerChip(player.id)}
                            className="rounded p-1 text-gray-400 transition hover:bg-gray-800 hover:text-white"
                            aria-label={`Remove ${player.name}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add More Button */}
                  <button
                    type="button"
                    onClick={() => setIsPlayerPickerOpen(true)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/5 py-2 text-xs font-semibold text-blue-400 transition hover:border-blue-500/50 hover:bg-blue-500/15"
                  >
                    <Plus size={14} />
                    <span>+ Add More Players</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      </Modal>

      {/* State 3: Player Picker Modal with Search, Tabs, Favorites, and New Player creation */}
      <SelectPlayersModal
        isOpen={isPlayerPickerOpen}
        onClose={() => setIsPlayerPickerOpen(false)}
        selectedPlayerIds={formData.playerIds}
        onSave={(newSelectedIds) => {
          setFormData((prev) => ({ ...prev, playerIds: newSelectedIds }));
        }}
        availablePlayers={availablePlayers}
        onPlayerCreated={(newPlayer) => {
          setAvailablePlayers((prev) => [...prev, newPlayer]);
        }}
      />
    </>
  );
}
