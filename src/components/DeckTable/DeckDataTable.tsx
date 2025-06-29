import { useState } from "react";
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
import { ChevronDown, Download, Settings2 } from "lucide-react";
import type { Card as ScryfallCard } from "@/types/scryfall";
import { ManaSymbols } from "@/utils/manaSymbols";
import { parseManaSymbols } from "@/utils/parseManaSymbols";

export interface DeckCardData extends ScryfallCard {
  quantity?: number;
  board?: "mainboard" | "sideboard" | "commander" | "companion";
}

interface DeckDataTableProps {
  data: DeckCardData[];
}

export function DeckDataTable({ data }: DeckDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
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

  const columns: ColumnDef<DeckCardData>[] = [
    {
      accessorKey: "quantity",
      header: "Qty",
      cell: ({ row }) => (
        <div className="text-center font-medium text-white">
          {row.original.quantity || 1}
        </div>
      ),
    },
    {
      accessorKey: "image",
      header: "Image",
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
      header: "Name",
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
      header: "Board",
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
      header: "Type",
      cell: ({ row }) => (
        <div className="text-sm text-gray-400">
          {row.original.type_line}
        </div>
      ),
    },
    {
      accessorKey: "oracle_text",
      header: "Oracle Text",
      cell: ({ row }) => (
        <div className="text-sm text-gray-300 max-w-xs oracle-text-mana whitespace-pre-line">
          {row.original.oracle_text ? parseManaSymbols(row.original.oracle_text, 'ms') : "—"}
        </div>
      ),
    },
    {
      accessorKey: "flavor_text",
      header: "Flavor Text",
      cell: ({ row }) => (
        <div className="text-sm text-gray-400 italic max-w-xs">
          {row.original.flavor_text || "—"}
        </div>
      ),
    },
    {
      accessorKey: "keywords",
      header: "Keywords",
      cell: ({ row }) => (
        <div className="text-sm text-gray-300">
          {row.original.keywords?.join(", ") || "—"}
        </div>
      ),
    },
    {
      accessorKey: "set_name",
      header: "Set",
      cell: ({ row }) => (
        <div className="text-sm text-gray-300">
          {row.original.set_name}
        </div>
      ),
    },
    {
      accessorKey: "collector_number",
      header: "Collector #",
      cell: ({ row }) => (
        <div className="text-sm text-center text-gray-300">
          {row.original.collector_number}
        </div>
      ),
    },
    {
      accessorKey: "rarity",
      header: "Rarity",
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
      header: "Mana Cost",
      cell: ({ row }) => (
        <ManaSymbols 
          cost={row.original.mana_cost} 
          className="text-sm"
        />
      ),
    },
    {
      accessorKey: "cmc",
      header: "CMC",
      cell: ({ row }) => (
        <div className="text-sm text-center text-gray-300">
          {row.original.cmc}
        </div>
      ),
    },
    {
      accessorKey: "power",
      header: "Power",
      cell: ({ row }) => (
        <div className="text-sm text-center text-gray-300">
          {row.original.power || "—"}
        </div>
      ),
    },
    {
      accessorKey: "toughness",
      header: "Toughness",
      cell: ({ row }) => (
        <div className="text-sm text-center text-gray-300">
          {row.original.toughness || "—"}
        </div>
      ),
    },
    {
      accessorKey: "loyalty",
      header: "Loyalty",
      cell: ({ row }) => (
        <div className="text-sm text-center text-gray-300">
          {row.original.loyalty || "—"}
        </div>
      ),
    },
    {
      accessorKey: "colors",
      header: "Colors",
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
      header: "Artist",
      cell: ({ row }) => (
        <div className="text-sm text-gray-400">
          {row.original.artist}
        </div>
      ),
    },
    {
      accessorKey: "prices_usd",
      header: "Price (USD)",
      cell: ({ row }) => (
        <div className="text-sm text-right text-gray-300">
          ${row.original.prices?.usd || "—"}
        </div>
      ),
    },
    {
      accessorKey: "prices_usd_foil",
      header: "Foil Price",
      cell: ({ row }) => (
        <div className="text-sm text-right text-gray-300">
          ${row.original.prices?.usd_foil || "—"}
        </div>
      ),
    },
    {
      accessorKey: "legalities",
      header: "Format Legal",
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
      header: "Released",
      cell: ({ row }) => (
        <div className="text-sm text-gray-300">
          {row.original.released_at ? new Date(row.original.released_at).toLocaleDateString() : "—"}
        </div>
      ),
    },
    {
      accessorKey: "games",
      header: "Available In",
      cell: ({ row }) => (
        <div className="text-xs text-gray-300">
          {row.original.games?.join(", ") || "—"}
        </div>
      ),
    },
    {
      accessorKey: "frame",
      header: "Frame",
      cell: ({ row }) => (
        <div className="text-sm text-gray-300">
          {row.original.frame || "—"}
        </div>
      ),
    },
    {
      accessorKey: "promo",
      header: "Promo",
      cell: ({ row }) => (
        <div className="text-sm text-gray-300">
          {row.original.promo ? "Yes" : "No"}
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Filter cards..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm text-white placeholder:text-gray-400 bg-gray-800 border-gray-600 focus:border-gray-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gray-700"
              >
                <Settings2 className="mr-2 h-4 w-4" />
                View
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-600 text-gray-100">
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
            className="text-white hover:bg-gray-700"
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
              <TableRow key={headerGroup.id} className="border-b-0">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="bg-gray-800 text-gray-100 font-medium"
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
    </div>
  );
}