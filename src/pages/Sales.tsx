import { useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { SaleForm } from "@/components/sales/SaleForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MARKETPLACES } from "@/types/inventory";

export default function Sales() {
  const { sales } = useInventory();
  const [search, setSearch] = useState("");
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);

  const sortedSales = [...sales].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filteredSales = sortedSales.filter((sale) => {
    const matchesSearch = sale.sku.toLowerCase().includes(search.toLowerCase());
    const matchesMarketplace =
      marketplaceFilter === "all" || sale.marketplace === marketplaceFilter;
    return matchesSearch && matchesMarketplace;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Calculate totals for filtered sales
  const totals = filteredSales.reduce(
    (acc, sale) => ({
      revenue: acc.revenue + sale.salePrice * sale.quantity,
      profit: acc.profit + sale.netProfit,
    }),
    { revenue: 0, profit: 0 }
  );

  return (
    <MainLayout>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Vendas</h1>
          <p className="page-subtitle">{sales.length} vendas registradas</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Venda
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={marketplaceFilter} onValueChange={setMarketplaceFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Marketplace" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {MARKETPLACES.map((mp) => (
              <SelectItem key={mp} value={mp}>
                {mp}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      {filteredSales.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <div className="stat-card">
            <p className="stat-label">Receita Total (filtrado)</p>
            <p className="stat-value">{formatCurrency(totals.revenue)}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Lucro Total (filtrado)</p>
            <p className={`stat-value ${totals.profit >= 0 ? "stat-positive" : "stat-negative"}`}>
              {formatCurrency(totals.profit)}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Marketplace</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Preço Unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right hidden md:table-cell">Taxas</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Margem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ShoppingCart className="h-8 w-8" />
                      <p>{search || marketplaceFilter !== "all" ? "Nenhuma venda encontrada" : "Nenhuma venda registrada"}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {format(new Date(sale.date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium">
                        {sale.marketplace}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{sale.sku}</TableCell>
                    <TableCell className="text-right">{sale.quantity}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {formatCurrency(sale.salePrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(sale.salePrice * sale.quantity)}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell text-muted-foreground">
                      {formatCurrency(sale.platformFee + sale.shipping)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-medium ${
                          sale.netProfit >= 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        {formatCurrency(sale.netProfit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right hidden lg:table-cell">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          sale.margin >= 0.1
                            ? "bg-success/10 text-success"
                            : sale.margin >= 0
                            ? "bg-warning/10 text-warning"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {formatPercent(sale.margin)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Form Dialog */}
      <SaleForm open={formOpen} onOpenChange={setFormOpen} />
    </MainLayout>
  );
}
