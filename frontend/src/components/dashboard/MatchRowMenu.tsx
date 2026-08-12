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
        className="fixed z-50 w-36 overflow-hidden rounded-lg border border-app-border bg-app-card py-1 text-sm shadow-xl"
        style={{ top: y + 6, left: x }}
      >
        <button
          type="button"
          className="block w-full px-4 py-2 text-left text-app-text-primary/80 transition hover:bg-white/[0.06]"
          onClick={() => {
            onClose();
            onDetails(match);
          }}
        >
          Details
        </button>
        <button
          type="button"
          className="block w-full px-4 py-2 text-left text-app-text-primary/80 transition hover:bg-white/[0.06]"
          onClick={() => {
            onClose();
            onEdit(match);
          }}
        >
          Edit
        </button>
        <button
          type="button"
          className="block w-full px-4 py-2 text-left text-red-400 transition hover:bg-red-400/10"
          onClick={() => {
            onClose();
            onDelete(match);
          }}
        >
          Delete
        </button>
      </div>
    </>
  );
}
