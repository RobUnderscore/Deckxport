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
import { CSV_FIELDS, exportToCSV, saveCSVPreferences, loadCSVPreferences } from "@/utils/csvExport";
import type { DeckCardData } from "./DeckDataTable";
import { RotateCcw } from "lucide-react";

interface CSVExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: DeckCardData[];
  visibleColumns: string[];
}

export function CSVExportDialog({ open, onOpenChange, data, visibleColumns }: CSVExportDialogProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [hasCustomSelection, setHasCustomSelection] = useState(false);

  // Initialize with saved preferences or visible columns
  useEffect(() => {
    const savedPrefs = loadCSVPreferences();
    if (savedPrefs) {
      setSelectedFields(savedPrefs);
      setHasCustomSelection(true);
    } else {
      // Map visible columns to CSV field keys
      const mappedFields = visibleColumns.filter(col => 
        CSV_FIELDS.some(field => field.key === col)
      );
      setSelectedFields(mappedFields);
    }
  }, [visibleColumns]);

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev => {
      const newFields = prev.includes(fieldKey)
        ? prev.filter(f => f !== fieldKey)
        : [...prev, fieldKey];
      
      setHasCustomSelection(true);
      return newFields;
    });
  };

  const handleRevertToTable = () => {
    const mappedFields = visibleColumns.filter(col => 
      CSV_FIELDS.some(field => field.key === col)
    );
    setSelectedFields(mappedFields);
    setHasCustomSelection(false);
  };

  const handleExport = () => {
    if (selectedFields.length === 0) {
      alert("Please select at least one field to export");
      return;
    }

    // Save preferences
    if (hasCustomSelection) {
      saveCSVPreferences(selectedFields);
    }

    // Export CSV
    exportToCSV(data, selectedFields);
    onOpenChange(false);
  };

  const handleSelectAll = () => {
    setSelectedFields(CSV_FIELDS.map(field => field.key));
    setHasCustomSelection(true);
  };

  const handleSelectNone = () => {
    setSelectedFields([]);
    setHasCustomSelection(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Export to CSV</DialogTitle>
          <DialogDescription>
            Select the fields you want to include in your CSV export. Your selection will be saved for future exports.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Quick actions */}
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectNone}
              >
                Select None
              </Button>
            </div>
            {hasCustomSelection && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRevertToTable}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Revert to Table Fields
              </Button>
            )}
          </div>

          {/* Field selection grid */}
          <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
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

          {/* Selected count */}
          <div className="text-sm text-muted-foreground pt-2 border-t">
            {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''} selected
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={selectedFields.length === 0}
          >
            Export CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}