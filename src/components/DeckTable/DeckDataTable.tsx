import { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, Download, Settings2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { Card as ScryfallCard } from "@/types/scryfall";
import { ManaSymbols } from "@/utils/manaSymbols";
import { parseManaSymbols } from "@/utils/parseManaSymbols";
import { calculateTotalManaCost } from "@/utils/manaCost";
import { CSVExportDialog } from "./CSVExportDialog";

export interface DeckCardData extends ScryfallCard {
  quantity?: number;
  board?: "mainboard" | "sideboard" | "commander" | "companion";
}

interface DeckDataTableProps {
  data: DeckCardData[];
}

// Helper component for sortable column headers
function SortableHeader({ column, children }: { 
  column: {
    toggleSorting: (desc: boolean) => void;
    getIsSorted: () => "asc" | "desc" | false;
  }; 
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="h-7 p-0 hover:bg-transparent text-left font-medium text-xs w-full justify-start"
    >
      {children}
      {column.getIsSorted() === "asc" ? (
        <ArrowUp className="ml-1 h-3 w-3" />
      ) : column.getIsSorted() === "desc" ? (
        <ArrowDown className="ml-1 h-3 w-3" />
      ) : (
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
      )}
    </Button>
  );
}

export function DeckDataTable({ data }: DeckDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showCSVDialog, setShowCSVDialog] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // Show by default - essential deck building info
    board: true,
    type_line: true,
    mana_cost: true,
    cmc: true,
    rarity: true,
    prices_usd: true,
    
    // Hide by default - additional details
    oracle_text: false,
    flavor_text: false,
    set_name: false,
    collector_number: false,
    power: false,
    toughness: false,
    loyalty: false,
    colors: false,
    keywords: false,
    artist: false,
    prices_usd_foil: false,
    legalities: false,
    released_at: false,
    games: false,
    frame: false,
    promo: false,
  });

  const columns: ColumnDef<DeckCardData>[] = useMemo(() => [
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <div className="py-1">
          <SortableHeader column={column}>Qty</SortableHeader>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center font-medium text-white">
          {row.original.quantity || 1}
        </div>
      ),
    },
    {
      accessorKey: "image",
      header: () => <div className="py-1 text-xs">Image</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const card = row.original;
        const imageUrl = card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small;
        return (
          <div className="overflow-hidden rounded w-12 h-16">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={card.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <div className="flex flex-col gap-1.5 py-1">
          <SortableHeader column={column}>Name</SortableHeader>
          <Input
            placeholder="Filter names..."
            value={(column.getFilterValue() as string) ?? ""}
            onChange={(event) => column.setFilterValue(event.target.value)}
            className="w-full h-7 text-xs"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ),
      filterFn: "includesString",
      cell: ({ row }) => {
        const card = row.original;
        return (
          <div className="font-medium text-white text-sm">
            {card.name}
          </div>
        );
      },
    },
    {
      accessorKey: "board",
      header: ({ column }) => (
        <div className="flex flex-col gap-1.5 py-1">
          <SortableHeader column={column}>Board</SortableHeader>
          <Select
            value={(column.getFilterValue() as string) ?? "all"}
            onValueChange={(value) => column.setFilterValue(value === "all" ? undefined : value)}
          >
            <SelectTrigger className="h-7 w-full text-xs" onClick={(e) => e.stopPropagation()}>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All</SelectItem>
              <SelectItem value="mainboard" className="text-xs">Mainboard</SelectItem>
              <SelectItem value="sideboard" className="text-xs">Sideboard</SelectItem>
              <SelectItem value="commander" className="text-xs">Commander</SelectItem>
              <SelectItem value="companion" className="text-xs">Companion</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
      cell: ({ row }) => {
        const board = row.original.board || "mainboard";
        const boardColors: Record<string, string> = {
          mainboard: "bg-blue-500/20 text-blue-300",
          sideboard: "bg-orange-500/20 text-orange-300",
          commander: "bg-purple-500/20 text-purple-300",
          companion: "bg-green-500/20 text-green-300"
        };
        return (
          <div className={`text-xs font-medium capitalize px-2 py-1 rounded ${boardColors[board] || boardColors.mainboard}`}>
            {board}
          </div>
        );
      },
    },
    {
      accessorKey: "type_line",
      header: ({ column }) => (
        <div className="flex flex-col gap-1.5 py-1">
          <SortableHeader column={column}>Type</SortableHeader>
          <Input
            placeholder="Filter types..."
            value={(column.getFilterValue() as string) ?? ""}
            onChange={(event) => column.setFilterValue(event.target.value)}
            className="w-full h-7 text-xs"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ),
      filterFn: "includesString",
      cell: ({ row }) => (
        <div className="text-sm text-gray-400">
          {row.original.type_line}
        </div>
      ),
    },
    {
      accessorKey: "oracle_text",
      header: () => <div className="py-1 text-xs">Oracle Text</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const text = row.original.oracle_text;
        if (!text) return <div className="text-sm text-gray-300">—</div>;
        
        // Truncate long text but show full text on hover
        const maxLength = 150;
        const truncated = text.length > maxLength;
        const displayText = truncated ? text.substring(0, maxLength) + "..." : text;
        
        return (
          <div className="group relative">
            <div className="text-sm text-gray-300 oracle-text-mana whitespace-pre-line min-w-[200px] max-w-[300px]">
              {parseManaSymbols(displayText)}
            </div>
            {truncated && (
              <div className="absolute z-10 invisible group-hover:visible bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl -top-2 left-0 w-[400px] max-h-[300px] overflow-y-auto">
                <div className="text-sm text-gray-100 whitespace-pre-line oracle-text-mana">
                  {parseManaSymbols(text)}
                </div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "flavor_text",
      header: () => <div className="py-1 text-xs">Flavor Text</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const text = row.original.flavor_text;
        if (!text) return <div className="text-sm text-gray-400 italic">—</div>;
        
        // Truncate long text but show full text on hover
        const maxLength = 100;
        const truncated = text.length > maxLength;
        const displayText = truncated ? text.substring(0, maxLength) + "..." : text;
        
        return (
          <div className="group relative">
            <div className="text-sm text-gray-400 italic whitespace-pre-line min-w-[150px] max-w-[250px]">
              {displayText}
            </div>
            {truncated && (
              <div className="absolute z-10 invisible group-hover:visible bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl -top-2 left-0 w-[350px] max-h-[200px] overflow-y-auto">
                <div className="text-sm text-gray-100 italic whitespace-pre-line">
                  {text}
                </div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "keywords",
      header: ({ column }) => (
        <div className="py-1">
          <SortableHeader column={column}>Keywords</SortableHeader>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-gray-300">
          {row.original.keywords?.join(", ") || "—"}
        </div>
      ),
    },
    {
      accessorKey: "set_name",
      header: ({ column }) => (
        <div className="py-1">
          <SortableHeader column={column}>Set</SortableHeader>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-gray-300">
          {row.original.set_name}
        </div>
      ),
    },
    {
      accessorKey: "collector_number",
      header: ({ column }) => (
        <div className="py-1">
          <SortableHeader column={column}>Collector #</SortableHeader>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-center text-gray-300">
          {row.original.collector_number}
        </div>
      ),
    },
    {
      accessorKey: "rarity",
      header: ({ column }) => (
        <div className="flex flex-col gap-1.5 py-1">
          <SortableHeader column={column}>Rarity</SortableHeader>
          <Select
            value={(column.getFilterValue() as string) ?? "all"}
            onValueChange={(value) => column.setFilterValue(value === "all" ? undefined : value)}
          >
            <SelectTrigger className="h-7 w-full text-xs" onClick={(e) => e.stopPropagation()}>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All</SelectItem>
              <SelectItem value="common" className="text-xs">Common</SelectItem>
              <SelectItem value="uncommon" className="text-xs">Uncommon</SelectItem>
              <SelectItem value="rare" className="text-xs">Rare</SelectItem>
              <SelectItem value="mythic" className="text-xs">Mythic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
      cell: ({ row }) => {
        const rarity = row.original.rarity;
        const rarityColors: Record<string, string> = {
          mythic: "text-orange-500",
          rare: "text-yellow-500",
          uncommon: "text-gray-400",
          common: "text-gray-300"
        };
        return (
          <div className={`text-sm font-medium capitalize ${rarityColors[rarity] || "text-gray-300"}`}>
            {rarity}
          </div>
        );
      },
    },
    {
      accessorKey: "mana_cost",
      header: ({ column }) => (
        <div className="py-1">
          <SortableHeader column={column}>Mana Cost</SortableHeader>
        </div>
      ),
      sortingFn: (rowA, rowB) => {
        const costA = rowA.original.mana_cost;
        const costB = rowB.original.mana_cost;
        const totalA = calculateTotalManaCost(costA);
        const totalB = calculateTotalManaCost(costB);
        return totalA - totalB;
      },
      cell: ({ row }) => (
        <ManaSymbols 
          cost={row.original.mana_cost} 
          className="text-sm"
        />
      ),
    },
    {
      accessorKey: "cmc",
      header: ({ column }) => (
        <div className="py-1">
          <SortableHeader column={column}>CMC</SortableHeader>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-center text-gray-300">
          {row.original.cmc}
        </div>
      ),
    },
    {
      accessorKey: "power",
      header: ({ column }) => (
        <div className="py-1">
          <SortableHeader column={column}>Power</SortableHeader>
        </div>
      ),
      sortingFn: (rowA, rowB) => {
        const powerA = parseInt(rowA.original.power || "0") || 0;
        const powerB = parseInt(rowB.original.power || "0") || 0;
        return powerA - powerB;
      },
      cell: ({ row }) => (
        <div className="text-sm text-center text-gray-300">
          {row.original.power || "—"}
        </div>
      ),
    },
    {
      accessorKey: "toughness",
      header: ({ column }) => (
        <div className="py-1">
          <SortableHeader column={column}>Toughness</SortableHeader>
        </div>
      ),
      sortingFn: (rowA, rowB) => {
        const toughnessA = parseInt(rowA.original.toughness || "0") || 0;
        const toughnessB = parseInt(rowB.original.toughness || "0") || 0;
        return toughnessA - toughnessB;
      },
      cell: ({ row }) => (
        <div className="text-sm text-center text-gray-300">
          {row.original.toughness || "—"}
        </div>
      ),
    },
    {
      accessorKey: "loyalty",
      header: () => <div className="py-1 text-xs">Loyalty</div>,
      cell: ({ row }) => (
        <div className="text-sm text-center text-gray-300">
          {row.original.loyalty || "—"}
        </div>
      ),
    },
    {
      accessorKey: "colors",
      header: ({ column }) => (
        <div className="py-1">
          <SortableHeader column={column}>Colors</SortableHeader>
        </div>
      ),
      sortingFn: (rowA, rowB) => {
        const colorsA = rowA.original.colors?.length || 0;
        const colorsB = rowB.original.colors?.length || 0;
        return colorsA - colorsB;
      },
      cell: ({ row }) => {
        const colors = row.original.colors;
        if (!colors || colors.length === 0) {
          return <div className="text-sm text-gray-300">Colorless</div>;
        }
        
        return (
          <div className="flex items-center gap-1">
            {colors.map((color, index) => (
              <i
                key={index}
                className={`ms ms-${color.toLowerCase()} ms-cost ms-shadow`}
                aria-label={color}
              />
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "artist",
      header: ({ column }) => (
        <div className="py-1">
          <SortableHeader column={column}>Artist</SortableHeader>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-gray-400">
          {row.original.artist}
        </div>
      ),
    },
    {
      accessorKey: "prices_usd",
      header: ({ column }) => (
        <div className="py-1">
          <SortableHeader column={column}>Price (USD)</SortableHeader>
        </div>
      ),
      sortingFn: (rowA, rowB) => {
        const priceA = parseFloat(rowA.original.prices?.usd || "0") || 0;
        const priceB = parseFloat(rowB.original.prices?.usd || "0") || 0;
        return priceA - priceB;
      },
      cell: ({ row }) => (
        <div className="text-sm text-right text-gray-300">
          ${row.original.prices?.usd || "—"}
        </div>
      ),
    },
    {
      accessorKey: "prices_usd_foil",
      header: () => <div className="py-1 text-xs">Foil Price</div>,
      cell: ({ row }) => (
        <div className="text-sm text-right text-gray-300">
          ${row.original.prices?.usd_foil || "—"}
        </div>
      ),
    },
    {
      accessorKey: "legalities",
      header: () => <div className="py-1 text-xs">Format Legal</div>,
      cell: ({ row }) => {
        const legalities = row.original.legalities;
        const commonFormats = ["standard", "pioneer", "modern", "commander"];
        const legalFormats = commonFormats.filter(
          format => legalities?.[format as keyof typeof legalities] === "legal"
        );
        return (
          <div className="text-xs text-gray-300">
            {legalFormats.length > 0 ? legalFormats.join(", ") : "Not Legal"}
          </div>
        );
      },
    },
    {
      accessorKey: "released_at",
      header: () => <div className="py-1 text-xs">Released</div>,
      cell: ({ row }) => (
        <div className="text-sm text-gray-300">
          {row.original.released_at ? new Date(row.original.released_at).toLocaleDateString() : "—"}
        </div>
      ),
    },
    {
      accessorKey: "games",
      header: () => <div className="py-1 text-xs">Available In</div>,
      cell: ({ row }) => (
        <div className="text-xs text-gray-300">
          {row.original.games?.join(", ") || "—"}
        </div>
      ),
    },
    {
      accessorKey: "frame",
      header: () => <div className="py-1 text-xs">Frame</div>,
      cell: ({ row }) => (
        <div className="text-sm text-gray-300">
          {row.original.frame || "—"}
        </div>
      ),
    },
    {
      accessorKey: "promo",
      header: () => <div className="py-1 text-xs">Promo</div>,
      cell: ({ row }) => (
        <div className="text-sm text-gray-300">
          {row.original.promo ? "Yes" : "No"}
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      // Only search in visible columns
      const visibleColumns = Object.keys(columnVisibility).filter(
        (col) => columnVisibility[col as keyof VisibilityState] !== false
      );
      
      const searchValue = filterValue.toLowerCase();
      
      // Check each visible column
      for (const colId of visibleColumns) {
        const value = row.getValue(colId);
        if (value != null) {
          let stringValue = "";
          
          // Handle different data types
          if (colId === "colors" && Array.isArray(value)) {
            stringValue = value.join(" ").toLowerCase();
          } else if (colId === "keywords" && Array.isArray(value)) {
            stringValue = value.join(" ").toLowerCase();
          } else if (colId === "games" && Array.isArray(value)) {
            stringValue = value.join(" ").toLowerCase();
          } else if (colId === "prices_usd") {
            stringValue = row.original.prices?.usd || "";
          } else if (colId === "prices_usd_foil") {
            stringValue = row.original.prices?.usd_foil || "";
          } else if (colId === "legalities") {
            // Search through legal formats
            const legalities = row.original.legalities;
            const commonFormats = ["standard", "pioneer", "modern", "commander"];
            const legalFormats = commonFormats.filter(
              format => legalities?.[format as keyof typeof legalities] === "legal"
            );
            stringValue = legalFormats.join(" ").toLowerCase();
          } else {
            stringValue = String(value).toLowerCase();
          }
          
          if (stringValue.includes(searchValue)) {
            return true;
          }
        }
      }
      
      return false;
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  });


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search all cards..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
              >
                <Settings2 className="mr-2 h-4 w-4" />
                View
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id.replace(/_/g, " ")}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCSVDialog(true)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
      <div className="rounded-md border bg-gray-900/90 backdrop-blur-sm border-gray-700">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-gray-700">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="bg-gray-800 text-gray-100 font-medium px-3 py-2"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-gray-800/50 border-gray-700"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-gray-400"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* CSV Export Dialog */}
      <CSVExportDialog
        open={showCSVDialog}
        onOpenChange={setShowCSVDialog}
        data={data}
        visibleColumns={Object.keys(columnVisibility).filter(
          (col) => columnVisibility[col as keyof VisibilityState] !== false
        )}
      />
    </div>
  );
}