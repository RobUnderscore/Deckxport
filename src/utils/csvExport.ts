import type { DeckCardData } from "@/components/DeckTable";

export interface CSVFieldConfig {
  key: keyof DeckCardData | "legalities" | "prices_usd" | "prices_usd_foil";
  label: string;
  formatter?: (value: any, card: DeckCardData) => string;
}

export const CSV_FIELDS: CSVFieldConfig[] = [
  { key: "quantity", label: "Quantity" },
  { key: "name", label: "Name" },
  { key: "board", label: "Board" },
  { key: "type_line", label: "Type" },
  { key: "mana_cost", label: "Mana Cost" },
  { key: "cmc", label: "CMC" },
  { key: "colors", label: "Colors", formatter: (colors) => colors?.join(", ") || "Colorless" },
  { key: "rarity", label: "Rarity" },
  { key: "set_name", label: "Set" },
  { key: "collector_number", label: "Collector #" },
  { key: "power", label: "Power" },
  { key: "toughness", label: "Toughness" },
  { key: "loyalty", label: "Loyalty" },
  { key: "oracle_text", label: "Oracle Text" },
  { key: "flavor_text", label: "Flavor Text" },
  { key: "keywords", label: "Keywords", formatter: (keywords) => keywords?.join(", ") || "" },
  { key: "artist", label: "Artist" },
  { key: "prices_usd", label: "Price (USD)", formatter: (_, card) => card.prices?.usd || "" },
  { key: "prices_usd_foil", label: "Foil Price (USD)", formatter: (_, card) => card.prices?.usd_foil || "" },
  { 
    key: "legalities", 
    label: "Format Legal", 
    formatter: (_, card) => {
      const legalities = card.legalities;
      const commonFormats = ["standard", "pioneer", "modern", "commander"];
      const legalFormats = commonFormats.filter(
        format => legalities?.[format as keyof typeof legalities] === "legal"
      );
      return legalFormats.join(", ");
    }
  },
  { key: "released_at", label: "Released", formatter: (date) => date ? new Date(date).toLocaleDateString() : "" },
  { key: "games", label: "Available In", formatter: (games) => games?.join(", ") || "" },
  { key: "frame", label: "Frame" },
  { key: "promo", label: "Promo", formatter: (promo) => promo ? "Yes" : "No" },
];

export function exportToCSV(cards: DeckCardData[], selectedFields: string[]): void {
  const fields = CSV_FIELDS.filter(field => selectedFields.includes(field.key));
  
  // Create CSV header
  const headers = fields.map(field => `"${field.label}"`).join(",");
  
  // Create CSV rows
  const rows = cards.map(card => {
    return fields.map(field => {
      let value: any;
      
      if (field.formatter) {
        value = field.formatter(card[field.key as keyof DeckCardData], card);
      } else {
        value = card[field.key as keyof DeckCardData] ?? "";
      }
      
      // Escape quotes and wrap in quotes if value contains comma, newline, or quotes
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(",");
  });
  
  // Combine header and rows
  const csv = [headers, ...rows].join("\n");
  
  // Add BOM for proper UTF-8 encoding
  const BOM = "\uFEFF";
  
  // Create blob and download
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `deck_export_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Local storage key for preferences
const CSV_PREFS_KEY = "deckxport_csv_fields";

export function saveCSVPreferences(fields: string[]): void {
  localStorage.setItem(CSV_PREFS_KEY, JSON.stringify(fields));
}

export function loadCSVPreferences(): string[] | null {
  const saved = localStorage.getItem(CSV_PREFS_KEY);
  return saved ? JSON.parse(saved) : null;
}