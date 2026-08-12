import { Button } from "@/components/ui/button";
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
        <Button
          variant="ghost"
          className="h-auto w-full justify-start rounded-none px-4 py-2 font-normal text-app-text-primary/80"
          onClick={() => {
            onClose();
            onDetails(match);
          }}
        >
          Details
        </Button>
        <Button
          variant="ghost"
          className="h-auto w-full justify-start rounded-none px-4 py-2 font-normal text-app-text-primary/80"
          onClick={() => {
            onClose();
            onEdit(match);
          }}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          className="h-auto w-full justify-start rounded-none px-4 py-2 font-normal text-red-400 hover:bg-red-400/10 hover:text-red-400"
          onClick={() => {
            onClose();
            onDelete(match);
          }}
        >
          Delete
        </Button>
      </div>
    </>
  );
}
