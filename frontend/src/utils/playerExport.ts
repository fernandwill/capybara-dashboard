import jsPDF from "jspdf";
import autoTable, { CellHookData } from "jspdf-autotable";
import { Match, Player } from "@/types/types";

export const exportPlayerList = (match: Match, players: Player[]) => {
    const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
    });

    pdf.setFontSize(12);
    pdf.text(match.location, 14, 15);
    pdf.setFontSize(11);
    pdf.setTextColor(100);

    const date = new Date(match.date).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
    });

    pdf.text(`${date} | Court: ${match.courtNumber || "N/A"}`, 14, 22);

    const tableColumn = ["No.", "Name", "", "", "", "", "", "", ""];
    const tableRows = players.map((player, index) => [index + 1, player.name.toUpperCase(), "", "", "", "", "", "", ""]);

    autoTable(pdf, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        theme: "grid",
        headStyles: {
            fillColor: [40, 40, 40],
            textColor: [255, 255, 255],
            halign: "center"
        },
        columnStyles: {
            0: { cellWidth: 15, halign: "center" },
            1: { cellWidth: 80 },
        },
        styles: {
            fontSize: 10,
            cellPadding: 3,
        },
        didParseCell: (data: CellHookData) => {
            if (data.column.index > 1) {
                data.cell.styles.cellWidth = "auto";
            }
        }
    });

    const fileName = `Match_${match.location.replace(/\s+/g, "_")}_${match.date.split("T")[0]}.pdf`;
    pdf.save(fileName);
}