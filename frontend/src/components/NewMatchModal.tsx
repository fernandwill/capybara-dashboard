"use client";

import { useEffect, useState } from "react";
import {Match} from "@/types/types";

interface MatchData {
  title: string;
  location: string;
  courtNumber: string;
  date: string;
  time: string;
  fee: number;
  status: string;
  description?: string;
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{editingMatch ? "Edit Match" : "Create New Match"}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close match form">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
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

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-create">
              {editingMatch ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
