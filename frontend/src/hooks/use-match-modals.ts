"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Match, ModalState } from "@/types/types";
import type { MatchFormData } from "@/hooks/use-matches";

interface UseMatchModalsOptions {
  matches: Match[];
  createMatch: (data: MatchFormData) => Promise<boolean>;
  updateMatch: (id: string, data: MatchFormData) => Promise<boolean>;
  deleteMatch: (id: string) => Promise<boolean>;
}

/**
 * Shared state + handlers for the match modal set (new/edit, details,
 * delete, row menu, success/error) used by the dashboard and the matches
 * history page, so both pages stay in sync instead of duplicating ~150 lines.
 */
export function useMatchModals({
  matches,
  createMatch,
  updateMatch,
  deleteMatch,
}: UseMatchModalsOptions) {
  const router = useRouter();

  // Modal state
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompletedMatch, setSelectedCompletedMatch] = useState<Match | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [matchPendingDeletion, setMatchPendingDeletion] = useState<Match | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingMatch, setIsDeletingMatch] = useState(false);
  const [isSubmittingMatch, setIsSubmittingMatch] = useState(false);
  const [menu, setMenu] = useState<{ match: Match; x: number; y: number } | null>(null);
  const [successModal, setSuccessModal] = useState<ModalState>({
    isOpen: false,
    title: "",
    message: "",
  });
  const [errorModal, setErrorModal] = useState<ModalState>({
    isOpen: false,
    title: "",
    message: "",
  });

  const activeCompletedMatch = useMemo(() => {
    if (!selectedCompletedMatch) return null;
    return (
      matches.find((m) => m.id === selectedCompletedMatch.id) ||
      selectedCompletedMatch
    );
  }, [matches, selectedCompletedMatch]);

  const handleNewMatch = useCallback(() => {
    setEditingMatch(null);
    setIsModalOpen(true);
  }, []);

  const handleEditMatch = useCallback((match: Match) => {
    setEditingMatch(match);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingMatch(null);
  }, []);

  const handleMatchClick = useCallback(
    (match: Match) => {
      if (match.status === "COMPLETED") {
        setSelectedCompletedMatch(match);
        setIsDetailsModalOpen(true);
      } else {
        router.push(`/matches/${match.id}`);
      }
    },
    [router]
  );

  const handleCloseDetailsModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setSelectedCompletedMatch(null);
  }, []);

  const handleRequestDeleteMatch = useCallback((match: Match) => {
    setMatchPendingDeletion(match);
    setIsDeleteModalOpen(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setMatchPendingDeletion(null);
  }, []);

  const handleConfirmDeleteMatch = useCallback(async () => {
    if (!matchPendingDeletion) return;

    setIsDeletingMatch(true);
    try {
      const success = await deleteMatch(matchPendingDeletion.id);

      if (success) {
        handleCloseDeleteModal();
        setSuccessModal({
          isOpen: true,
          title: "Success!",
          message: "Match deleted successfully!",
        });
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Error deleting match:", error);
      setErrorModal({
        isOpen: true,
        title: "Error!",
        message: "Failed to delete match. Please try again.",
      });
    } finally {
      setIsDeletingMatch(false);
    }
  }, [matchPendingDeletion, deleteMatch, handleCloseDeleteModal]);

  const handleSubmitMatch = useCallback(
    async (matchData: MatchFormData) => {
      setIsSubmittingMatch(true);
      try {
        const isEditing = editingMatch !== null;

        const success = isEditing
          ? await updateMatch(editingMatch.id, matchData)
          : await createMatch(matchData);

        if (!success) {
          throw new Error("Operation failed");
        }

        setIsModalOpen(false);
        setEditingMatch(null);

        setSuccessModal({
          isOpen: true,
          title: "Success!",
          message: `Match ${isEditing ? "updated" : "created"} successfully!`,
        });
      } catch (error) {
        console.error(
          `Error ${editingMatch ? "updating" : "creating"} match:`,
          error
        );
        setErrorModal({
          isOpen: true,
          title: "Error!",
          message: `Failed to ${editingMatch ? "update" : "create"} match. Please try again.`,
        });
      } finally {
        setIsSubmittingMatch(false);
      }
    },
    [editingMatch, createMatch, updateMatch]
  );

  const openRowMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, match: Match) => {
      event.stopPropagation();
      const rect = event.currentTarget.getBoundingClientRect();
      const menuWidth = 176;
      setMenu({ match, x: Math.max(8, rect.right - menuWidth), y: rect.bottom });
    },
    []
  );

  const closeRowMenu = useCallback(() => setMenu(null), []);

  return {
    editingMatch,
    isModalOpen,
    selectedCompletedMatch,
    isDetailsModalOpen,
    matchPendingDeletion,
    isDeleteModalOpen,
    isDeletingMatch,
    isSubmittingMatch,
    menu,
    successModal,
    errorModal,
    activeCompletedMatch,
    handleNewMatch,
    handleEditMatch,
    handleCloseModal,
    handleMatchClick,
    handleCloseDetailsModal,
    handleRequestDeleteMatch,
    handleCloseDeleteModal,
    handleConfirmDeleteMatch,
    handleSubmitMatch,
    openRowMenu,
    closeRowMenu,
    setSuccessModal,
    setErrorModal,
  };
}
