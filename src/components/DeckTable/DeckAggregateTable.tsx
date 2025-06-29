import { useState, useMemo, useEffect, useRef } from "react";
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
  DropdownMenuSeparator,
  DropdownMenuItem,
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
import { ChevronDown, Download, Settings2, ArrowUpDown, ArrowUp, ArrowDown, Tag, RotateCcw } from "lucide-react";
import type { CardAggregate } from "@/types/cardAggregate";
import { ManaSymbols } from "@/utils/manaSymbols";
import { CSVExportDialog } from "./CSVExportAggregateDialog";
import { 
  loadColumnVisibility, 
  saveColumnVisibility, 
  loadSorting, 
  saveSorting 
} from "@/utils/tablePreferences";

interface DeckAggregateTableProps {
  cards: CardAggregate[];
  deckName?: string;
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

export function DeckAggregateTable({ cards, deckName = "Deck" }: DeckAggregateTableProps) {
  // Load saved preferences or use defaults
  const [sorting, setSorting] = useState<SortingState>(() => {
    return loadSorting() || [];
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showCSVDialog, setShowCSVDialog] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const saved = loadColumnVisibility();
    if (saved) return saved;
    
    // Default visibility
    return {
      // Show by default - essential deck building info
      board: true,
      typeLine: true,
      manaCost: true,
      cmc: true,
      rarity: true,
      pricesUsd: true,
      oracleTags: true,
      
      // Hide by default - additional details
      oracleText: false,
      flavorText: false,
      setName: false,
      collectorNumber: false,
      power: false,
      toughness: false,
      loyalty: false,
      colors: false,
      artist: false,
      pricesUsdFoil: false,
      legalities: false,
      releasedAt: false,
    };
  });

  // Use refs to track if we should save (avoid saving on initial load)
  const hasInteracted = useRef(false);

  // Save column visibility when it changes (with debounce)
  useEffect(() => {
    if (!hasInteracted.current) return;
    
    const timeoutId = setTimeout(() => {
      saveColumnVisibility(columnVisibility);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [columnVisibility]);

  // Save sorting when it changes
  useEffect(() => {
    if (!hasInteracted.current) return;
    
    const timeoutId = setTimeout(() => {
      saveSorting(sorting);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [sorting]);

  // Mark as interacted after initial render
  useEffect(() => {
    hasInteracted.current = true;
  }, []);

  const columns: ColumnDef<CardAggregate>[] = useMemo(() => [
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
        const imageUrl = card.imageUris?.small;
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
        const board = row.original.board;
        const boardColors: Record<string, string> = {
          mainboard: "bg-blue-500/20 text-blue-300",
          sideboard: "bg-orange-500/20 text-orange-300",
          commander: "bg-purple-500/20 text-purple-300",
          companion: "bg-green-500/20 text-green-300"
        };
        return (
          <div className={`px-2 py-1 rounded text-xs font-medium ${boardColors[board]}`}>
            {board}
          </div>
        );
      },
    },
    {
      accessorKey: "typeLine",
      header: ({ column }) => <SortableHeader column={column}>Type</SortableHeader>,
      cell: ({ row }) => (
        <div className="text-sm text-gray-300">
          {row.original.typeLine}
        </div>
      ),
    },
    {
      accessorKey: "manaCost",
      header: ({ column }) => <SortableHeader column={column}>Mana</SortableHeader>,
      cell: ({ row }) => {
        const manaCost = row.original.manaCost;
        if (!manaCost) return null;
        
        return <ManaSymbols cost={manaCost} size="ms-cost" />;
      },
    },
    {
      accessorKey: "cmc",
      header: ({ column }) => <SortableHeader column={column}>CMC</SortableHeader>,
      cell: ({ row }) => (
        <div className="text-center text-sm">
          {row.original.cmc}
        </div>
      ),
    },
    {
      accessorKey: "power",
      header: ({ column }) => <SortableHeader column={column}>P/T</SortableHeader>,
      cell: ({ row }) => {
        const card = row.original;
        if (!card.power && !card.toughness) return null;
        return (
          <div className="text-sm">
            {card.power}/{card.toughness}
          </div>
        );
      },
    },
    {
      accessorKey: "loyalty",
      header: ({ column }) => <SortableHeader column={column}>Loyalty</SortableHeader>,
      cell: ({ row }) => {
        const loyalty = row.original.loyalty;
        if (!loyalty) return null;
        return <div className="text-sm">{loyalty}</div>;
      },
    },
    {
      accessorKey: "rarity",
      header: ({ column }) => <SortableHeader column={column}>Rarity</SortableHeader>,
      cell: ({ row }) => {
        const rarity = row.original.rarity;
        const rarityColors: Record<string, string> = {
          common: "text-gray-400",
          uncommon: "text-gray-300",
          rare: "text-yellow-400",
          mythic: "text-orange-400",
          special: "text-purple-400",
          bonus: "text-pink-400",
        };
        return (
          <div className={`text-sm capitalize ${rarityColors[rarity] || "text-gray-400"}`}>
            {rarity}
          </div>
        );
      },
    },
    {
      accessorKey: "oracleTags",
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <Tag className="h-3 w-3" />
          <SortableHeader column={column}>Tags</SortableHeader>
        </div>
      ),
      cell: ({ row }) => {
        const tags = row.original.oracleTags;
        if (!tags || tags.length === 0) {
          if (row.original.taggerError) {
            return (
              <div className="text-xs text-red-400" title={row.original.taggerError}>
                Error
              </div>
            );
          }
          return <div className="text-xs text-gray-500">None</div>;
        }
        
        // Show first few tags, with tooltip for all
        const displayTags = tags.slice(0, 2);
        const hasMore = tags.length > 2;
        
        return (
          <div className="flex flex-wrap gap-1" title={tags.join(", ")}>
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {hasMore && (
              <span className="text-xs text-gray-400">+{tags.length - 2}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "pricesUsd",
      header: ({ column }) => <SortableHeader column={column}>Price</SortableHeader>,
      accessorFn: (row) => parseFloat(row.prices?.usd || "0"),
      cell: ({ row }) => {
        const price = row.original.prices?.usd;
        if (!price) return <div className="text-sm text-gray-500">-</div>;
        return (
          <div className="text-sm font-medium">
            ${parseFloat(price).toFixed(2)}
          </div>
        );
      },
    },
    {
      accessorKey: "pricesUsdFoil",
      header: ({ column }) => <SortableHeader column={column}>Foil Price</SortableHeader>,
      accessorFn: (row) => parseFloat(row.prices?.usd_foil || "0"),
      cell: ({ row }) => {
        const price = row.original.prices?.usd_foil;
        if (!price) return <div className="text-sm text-gray-500">-</div>;
        return (
          <div className="text-sm font-medium">
            ${parseFloat(price).toFixed(2)}
          </div>
        );
      },
    },
    {
      accessorKey: "colors",
      header: "Colors",
      cell: ({ row }) => {
        const colors = row.original.colors;
        const colorMap: Record<string, string> = {
          W: "⚪",
          U: "🔵",
          B: "⚫",
          R: "🔴",
          G: "🟢",
        };
        return (
          <div className="flex gap-0.5">
            {colors.map((color) => (
              <span key={color}>{colorMap[color] || color}</span>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "setName",
      header: ({ column }) => <SortableHeader column={column}>Set</SortableHeader>,
      cell: ({ row }) => (
        <div className="text-sm">{row.original.setName}</div>
      ),
    },
    {
      accessorKey: "collectorNumber",
      header: "Collector #",
      cell: ({ row }) => (
        <div className="text-sm">{row.original.collectorNumber}</div>
      ),
    },
    {
      accessorKey: "artist",
      header: ({ column }) => <SortableHeader column={column}>Artist</SortableHeader>,
      cell: ({ row }) => (
        <div className="text-sm text-gray-400">{row.original.artist}</div>
      ),
    },
    {
      accessorKey: "releasedAt",
      header: ({ column }) => <SortableHeader column={column}>Released</SortableHeader>,
      cell: ({ row }) => {
        const date = row.original.releasedAt;
        if (!date) return null;
        return (
          <div className="text-sm">
            {new Date(date).toLocaleDateString()}
          </div>
        );
      },
    },
    {
      accessorKey: "oracleText",
      header: "Oracle Text",
      cell: ({ row }) => (
        <div className="text-xs text-gray-400 max-w-xs truncate">
          {row.original.oracleText}
        </div>
      ),
    },
    {
      accessorKey: "flavorText",
      header: "Flavor Text",
      cell: ({ row }) => (
        <div className="text-xs text-gray-400 max-w-xs truncate italic">
          {row.original.flavorText}
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: cards,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  // Calculate deck stats
  const deckStats = useMemo(() => {
    const mainboardCards = cards.filter(c => c.board === "mainboard");
    const sideboardCards = cards.filter(c => c.board === "sideboard");
    
    const totalCards = mainboardCards.reduce((sum, card) => sum + card.quantity, 0);
    const totalSideboard = sideboardCards.reduce((sum, card) => sum + card.quantity, 0);
    
    const totalCost = cards.reduce((sum, card) => 
      sum + (parseFloat(card.prices?.usd || "0") * card.quantity), 0
    );
    
    const avgCmc = mainboardCards.length > 0 
      ? mainboardCards.reduce((sum, card) => sum + (card.cmc * card.quantity), 0) / totalCards
      : 0;

    const withTags = cards.filter(c => c.oracleTags.length > 0).length;
    const withErrors = cards.filter(c => c.taggerError).length;
    
    return {
      totalCards,
      totalSideboard,
      uniqueCards: mainboardCards.length,
      totalCost,
      avgCmc,
      withTags,
      withErrors,
    };
  }, [cards]);

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search all cards..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCSVDialog(true)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="mr-2 h-4 w-4" />
                Columns
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-semibold">Column Visibility</div>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize text-sm"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id.replace(/_/g, " ")}
                    </DropdownMenuCheckboxItem>
                  ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  // Show all columns
                  const allVisible: VisibilityState = {};
                  table.getAllColumns().forEach(column => {
                    if (column.getCanHide()) {
                      allVisible[column.id] = true;
                    }
                  });
                  setColumnVisibility(allVisible);
                }}
              >
                Show All
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  // Hide optional columns
                  const minimalVisible: VisibilityState = {
                    board: true,
                    typeLine: true,
                    manaCost: true,
                    cmc: true,
                    rarity: true,
                    pricesUsd: true,
                  };
                  setColumnVisibility(minimalVisible);
                }}
              >
                Show Minimal
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  // Reset to default visibility
                  const defaultVisibility: VisibilityState = {
                    board: true,
                    typeLine: true,
                    manaCost: true,
                    cmc: true,
                    rarity: true,
                    pricesUsd: true,
                    oracleTags: true,
                    oracleText: false,
                    flavorText: false,
                    setName: false,
                    collectorNumber: false,
                    power: false,
                    toughness: false,
                    loyalty: false,
                    colors: false,
                    artist: false,
                    pricesUsdFoil: false,
                    legalities: false,
                    releasedAt: false,
                  };
                  setColumnVisibility(defaultVisibility);
                  // Also reset sorting
                  setSorting([]);
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset to Defaults
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Your preferences are saved automatically
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Deck Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="text-xs text-muted-foreground">Total Cards</div>
          <div className="text-xl font-bold">{deckStats.totalCards}</div>
        </div>
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="text-xs text-muted-foreground">Sideboard</div>
          <div className="text-xl font-bold">{deckStats.totalSideboard}</div>
        </div>
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="text-xs text-muted-foreground">Unique Cards</div>
          <div className="text-xl font-bold">{deckStats.uniqueCards}</div>
        </div>
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="text-xs text-muted-foreground">Avg CMC</div>
          <div className="text-xl font-bold">{deckStats.avgCmc.toFixed(2)}</div>
        </div>
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="text-xs text-muted-foreground">Total Cost</div>
          <div className="text-xl font-bold">${deckStats.totalCost.toFixed(2)}</div>
        </div>
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="text-xs text-muted-foreground">With Tags</div>
          <div className="text-xl font-bold text-green-400">{deckStats.withTags}</div>
        </div>
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="text-xs text-muted-foreground">Tag Errors</div>
          <div className="text-xl font-bold text-red-400">{deckStats.withErrors}</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-2">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-2 py-2">
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
                  className="h-24 text-center"
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
        cards={cards}
        deckName={deckName}
      />
    </div>
  );
}