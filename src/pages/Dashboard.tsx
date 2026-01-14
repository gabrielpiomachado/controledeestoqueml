import { useInventory } from "@/contexts/InventoryContext";
import { StatCard } from "@/components/dashboard/StatCard";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  AlertTriangle,
  ArrowDownToLine
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { stats, sales, stockEntries, products } = useInventory();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Get recent sales
  const recentSales = [...sales]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Get low stock products
  const lowStockProducts = products.filter(p => p.stock <= 5 && p.stock > 0);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  return (
    <MainLayout>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Visão geral do seu estoque e vendas</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <StatCard
          title="Valor Investido"
          value={formatCurrency(stats.totalInvested)}
          subtitle="Total em entradas"
          icon={ArrowDownToLine}
          trend="neutral"
        />
        <StatCard
          title="Valor em Estoque"
          value={formatCurrency(stats.totalInventoryValue)}
          subtitle={`${stats.totalProducts} produtos`}
          icon={Package}
          trend="neutral"
        />
        <StatCard
          title="Total de Vendas"
          value={formatCurrency(stats.totalSales)}
          subtitle={`${sales.length} vendas`}
          icon={ShoppingCart}
          trend="neutral"
        />
        <StatCard
          title="Lucro Total"
          value={formatCurrency(stats.totalProfit)}
          icon={DollarSign}
          trend={stats.totalProfit >= 0 ? "positive" : "negative"}
        />
        <StatCard
          title="Margem Média"
          value={formatPercent(stats.averageMargin)}
          icon={TrendingUp}
          trend={stats.averageMargin >= 0.1 ? "positive" : stats.averageMargin >= 0 ? "neutral" : "negative"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sales */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Vendas Recentes</h2>
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          </div>
          {recentSales.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma venda registrada
            </p>
          ) : (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{sale.sku}</p>
                    <p className="text-xs text-muted-foreground">
                      {sale.marketplace} • {format(new Date(sale.date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {formatCurrency(sale.salePrice * sale.quantity)}
                    </p>
                    <p className={`text-xs ${sale.netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatCurrency(sale.netProfit)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock Alerts */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Alertas de Estoque</h2>
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          {outOfStockProducts.length === 0 && lowStockProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhum alerta de estoque
            </p>
          ) : (
            <div className="space-y-3">
              {outOfStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{product.sku}</p>
                    <p className="text-xs text-muted-foreground">{product.category || "Sem categoria"}</p>
                  </div>
                  <span className="rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                    Sem estoque
                  </span>
                </div>
              ))}
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{product.sku}</p>
                    <p className="text-xs text-muted-foreground">{product.category || "Sem categoria"}</p>
                  </div>
                  <span className="rounded-full bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
                    {product.stock} unidades
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
