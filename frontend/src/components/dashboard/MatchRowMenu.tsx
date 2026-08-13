import { Eye, Pencil, Trash2 } from "lucide-react";
import { Match } from "@/types/types";

interface MatchRowMenuProps {
  menu: { match: Match; x: number; y: number } | null;
  onClose: () => void;
  onDetails: (match: Match) => void;
  onEdit: (match: Match) => void;
  onDelete: (match: Match) => void;
}

export default function MatchRowMenu({
  menu,
  onClose,
  onDetails,
  onEdit,
  onDelete,
}: MatchRowMenuProps) {
  if (!menu) return null;

  const { match, x, y } = menu;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        className="fixed z-50 w-40 overflow-hidden rounded-xl border border-app-border bg-app-input/95 p-1.5 text-xs shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95"
        style={{ top: y + 6, left: x }}
      >
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 font-medium text-app-text-secondary transition-colors hover:bg-app-hover hover:text-app-text-primary"
          onClick={() => {
            onClose();
            onDetails(match);
          }}
        >
          <Eye size={14} className="text-app-text-muted" />
          <span>View Details</span>
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 font-medium text-app-text-secondary transition-colors hover:bg-app-hover hover:text-app-text-primary"
          onClick={() => {
            onClose();
            onEdit(match);
          }}
        >
          <Pencil size={14} className="text-app-text-muted" />
          <span>Edit Match</span>
        </button>
        <div className="my-1 border-t border-app-border/60" />
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 font-medium text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
          onClick={() => {
            onClose();
            onDelete(match);
          }}
        >
          <Trash2 size={14} className="text-rose-400" />
          <span>Delete</span>
        </button>
      </div>
    </>
  );
}
