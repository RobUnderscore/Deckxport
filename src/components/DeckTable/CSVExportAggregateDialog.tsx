import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CardAggregate } from "@/types/cardAggregate";
import { RotateCcw, Download } from "lucide-react";

interface CSVField {
  key: string;
  label: string;
  getter: (card: CardAggregate) => string | number;
}

const CSV_FIELDS: CSVField[] = [
  { key: "quantity", label: "Quantity", getter: (c) => c.quantity },
  { key: "name", label: "Name", getter: (c) => c.name },
  { key: "board", label: "Board", getter: (c) => c.board },
  { key: "set", label: "Set Code", getter: (c) => c.set },
  { key: "setName", label: "Set Name", getter: (c) => c.setName },
  { key: "collectorNumber", label: "Collector Number", getter: (c) => c.collectorNumber },
  { key: "typeLine", label: "Type", getter: (c) => c.typeLine },
  { key: "manaCost", label: "Mana Cost", getter: (c) => c.manaCost || "" },
  { key: "cmc", label: "CMC", getter: (c) => c.cmc },
  { key: "colors", label: "Colors", getter: (c) => c.colors.join(", ") },
  { key: "colorIdentity", label: "Color Identity", getter: (c) => c.colorIdentity.join(", ") },
  { key: "power", label: "Power", getter: (c) => c.power || "" },
  { key: "toughness", label: "Toughness", getter: (c) => c.toughness || "" },
  { key: "loyalty", label: "Loyalty", getter: (c) => c.loyalty || "" },
  { key: "rarity", label: "Rarity", getter: (c) => c.rarity },
  { key: "artist", label: "Artist", getter: (c) => c.artist || "" },
  { key: "oracleText", label: "Oracle Text", getter: (c) => c.oracleText || "" },
  { key: "flavorText", label: "Flavor Text", getter: (c) => c.flavorText || "" },
  { key: "priceUsd", label: "Price USD", getter: (c) => c.prices?.usd || "" },
  { key: "priceUsdFoil", label: "Price USD Foil", getter: (c) => c.prices?.usd_foil || "" },
  { key: "priceEur", label: "Price EUR", getter: (c) => c.prices?.eur || "" },
  { key: "oracleTags", label: "Oracle Tags", getter: (c) => c.oracleTags.join("; ") },
  { key: "taggerError", label: "Tagger Error", getter: (c) => c.taggerError || "" },
  { key: "isFoil", label: "Is Foil", getter: (c) => c.isFoil ? "Yes" : "No" },
  { key: "condition", label: "Condition", getter: (c) => c.condition || "" },
  { key: "language", label: "Language", getter: (c) => c.language || "" },
];

// Default fields for export
const DEFAULT_FIELDS = [
  "quantity", "name", "board", "set", "collectorNumber", 
  "typeLine", "manaCost", "cmc", "rarity", "priceUsd", "oracleTags"
];

interface CSVExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: CardAggregate[];
  deckName?: string;
}

export function CSVExportDialog({ open, onOpenChange, cards, deckName = "deck" }: CSVExportDialogProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>(DEFAULT_FIELDS);
  const [hasCustomSelection, setHasCustomSelection] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem("csv-export-fields");
    if (saved) {
      try {
        const fields = JSON.parse(saved);
        setSelectedFields(fields);
        setHasCustomSelection(true);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev => {
      const newFields = prev.includes(fieldKey)
        ? prev.filter(f => f !== fieldKey)
        : [...prev, fieldKey];
      
      setHasCustomSelection(true);
      return newFields;
    });
  };

  const handleSelectAll = () => {
    setSelectedFields(CSV_FIELDS.map(f => f.key));
    setHasCustomSelection(true);
  };

  const handleSelectNone = () => {
    setSelectedFields([]);
    setHasCustomSelection(true);
  };

  const handleResetToDefault = () => {
    setSelectedFields(DEFAULT_FIELDS);
    setHasCustomSelection(false);
    localStorage.removeItem("csv-export-fields");
  };

  const handleExport = () => {
    if (selectedFields.length === 0) {
      alert("Please select at least one field to export");
      return;
    }

    // Save preferences
    if (hasCustomSelection) {
      localStorage.setItem("csv-export-fields", JSON.stringify(selectedFields));
    }

    // Build CSV content
    const selectedFieldObjs = CSV_FIELDS.filter(f => selectedFields.includes(f.key));
    
    // Headers
    const headers = selectedFieldObjs.map(f => `"${f.label}"`).join(",");
    
    // Rows
    const rows = cards.map(card => {
      return selectedFieldObjs.map(field => {
        const value = field.getter(card);
        // Escape quotes and wrap in quotes
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(",");
    });
    
    // Combine
    const csv = [headers, ...rows].join("\n");
    
    // Download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${deckName.replace(/[^a-z0-9]/gi, "_")}_export.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export to CSV</DialogTitle>
          <DialogDescription>
            Select the fields you want to include in your CSV export
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectNone}
            >
              Select None
            </Button>
            {hasCustomSelection && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToDefault}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset to Default
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {CSV_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center space-x-2">
                <Checkbox
                  id={field.key}
                  checked={selectedFields.includes(field.key)}
                  onCheckedChange={() => handleFieldToggle(field.key)}
                />
                <Label
                  htmlFor={field.key}
                  className="text-sm font-normal cursor-pointer"
                >
                  {field.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={selectedFields.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export {selectedFields.length} fields
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}