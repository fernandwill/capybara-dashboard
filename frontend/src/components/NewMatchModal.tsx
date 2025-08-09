"use client";

import { useState, useEffect } from "react";

interface Match {
  id: string;
  title: string;
  location: string;
  courtNumber: string;
  date: string;
  time: string;
  fee: number;
  status: string;
  description?: string;
  createdAt: string;
}

interface NewMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (matchData: unknown) => void;
  editingMatch?: Match | null;
}

export default function NewMatchModal({
  isOpen,
  onClose,
  onSubmit,
  editingMatch,
}: NewMatchModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    courtNumber: "",
    date: "",
    startTime: "16:00",
    endTime: "20:00",
    fee: 300000,
    description: "",
  });

  // Populate form when editing
  useEffect(() => {
    if (editingMatch) {
      const [startTime, endTime] = editingMatch.time.split('-');
      const formattedDate = new Date(editingMatch.date).toISOString().split('T')[0];
      
      setFormData({
        title: editingMatch.title,
        location: editingMatch.location,
        courtNumber: editingMatch.courtNumber,
        date: formattedDate,
        startTime: startTime || "16:00",
        endTime: endTime || "20:00",
        fee: editingMatch.fee,
        description: editingMatch.description || "",
      });
    } else {
      // Reset form for new match
      setFormData({
        title: "",
        location: "",
        courtNumber: "",
        date: "",
        startTime: "16:00",
        endTime: "20:00",
        fee: 300000,
        description: "",
      });
    }
  }, [editingMatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Combine date and time for the API
    const matchData = {
      title: formData.title,
      location: formData.location,
      courtNumber: formData.courtNumber,
      date: formData.date,
      time: `${formData.startTime}-${formData.endTime}`,
      fee: formData.fee,
      status: "UPCOMING",
      description: formData.description,
    };

    onSubmit(matchData);

    // Reset form
    setFormData({
      title: "",
      location: "",
      courtNumber: "",
      date: "",
      startTime: "16:00",
      endTime: "20:00",
      fee: 300000,
      description: "",
    });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "fee" ? Number(value) : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{editingMatch ? 'Edit Match' : 'Create New Match'}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
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
                placeholder="Match title"
              />
            </div>
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
                placeholder="Court location"
              />
            </div>
          </div>

          <div className="form-row">
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
                placeholder="1"
              />
            </div>
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
              <label htmlFor="fee">Price</label>
              <input
                type="number"
                id="fee"
                name="fee"
                value={formData.fee}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="300000"
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
              {editingMatch ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
