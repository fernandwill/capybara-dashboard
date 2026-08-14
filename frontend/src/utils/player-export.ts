import jsPDF from "jspdf";
import autoTable, { CellHookData } from "jspdf-autotable";
import { Match, Player } from "@/types/types";
import { formatDate, formatTimeWithDuration } from "@/utils/formatters";

// Mark-off cells per row. The court coordinator ticks one cell per game the
// player plays, so the play count is tallied by hand on paper.
const MARK_CELLS = 8;

// Fixed geometry for A4 portrait with 8mm margins. Kept in one place so the
// layout stays predictable: at ~5mm per row, 50 players fit on one page.
const PAGE_WIDTH = 210;
const MARGIN = 8;
const COL_NO = 9;
const COL_MARK = 7;
const ROW_HEIGHT = 5;

export const exportPlayerList = (match: Match, players: Player[]) => {
    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const contentWidth = PAGE_WIDTH - MARGIN * 2;
    const colName = contentWidth - COL_NO - MARK_CELLS * COL_MARK;

    // ---- Header: plain black text over a thin rule. No fills, no colors. ----
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(0);
    pdf.text((match.title || match.location).toUpperCase(), MARGIN, 13);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(match.location, MARGIN, 18.5);
    pdf.text(
        `${formatDate(match.date)}   |   ${formatTimeWithDuration(match.time)}   |   Court: ${match.courtNumber || "N/A"}`,
        MARGIN,
        23
    );

    pdf.setDrawColor(0);
    pdf.setLineWidth(0.4);
    pdf.line(MARGIN, 25.5, PAGE_WIDTH - MARGIN, 25.5);

    // ---- Table: dense black grid, unshaded header, compact rows. ----
    const head = [
        "No.",
        "PLAYER NAME",
        ...Array.from({ length: MARK_CELLS }, (_, i) => String(i + 1)),
    ];
    const body = players.map((player, index) => [
        String(index + 1),
        player.name.toUpperCase(),
        ...Array<string>(MARK_CELLS).fill(""),
    ]);

    autoTable(pdf, {
        head: [head],
        body,
        startY: 27,
        theme: "grid",
        styles: {
            font: "helvetica",
            fontSize: 7.5,
            textColor: 0,
            lineColor: 0,
            lineWidth: 0.15,
            // ~5mm rows (7.5pt line height ~3.0mm + 2mm vertical padding) so
            // 50 players fit on a single page.
            cellPadding: [1, 2],
            minCellHeight: ROW_HEIGHT,
            valign: "middle",
        },
        headStyles: {
            fillColor: false,
            textColor: 0,
            fontStyle: "bold",
            halign: "center",
        },
        bodyStyles: {
            fillColor: false,
        },
        columnStyles: {
            0: { cellWidth: COL_NO, halign: "center" },
            1: { cellWidth: colName, halign: "left", overflow: "ellipsize" },
        },
        didParseCell: (data: CellHookData) => {
            // Mark-off cells: centered content, column header left-aligned.
            if (data.column.index > 1) {
                data.cell.styles.halign = "center";
            }
            if (data.section === "head" && data.column.index === 1) {
                data.cell.styles.halign = "left";
            }
        },
    });

    const fileName = `Match_${match.location.replace(/\s+/g, "_")}_${match.date.split("T")[0]}.pdf`;
    pdf.save(fileName);
};