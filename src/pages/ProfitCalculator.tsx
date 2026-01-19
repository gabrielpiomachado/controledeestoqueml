import { useState, useMemo } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, TrendingUp, DollarSign } from "lucide-react";
import { MARKETPLACES } from "@/types/inventory";

type AdType = "classico" | "premium";

// Platform fees for Mercado Livre - Electronics category
const MERCADO_LIVRE_FEES = {
  classico: 13,
  premium: 18,
};

export default function ProfitCalculator() {
  const { products } = useInventory();
  
  const [selectedSku, setSelectedSku] = useState<string>("");
  const [marketplace, setMarketplace] = useState<string>("");
  const [adType, setAdType] = useState<AdType>("classico");
  const [shipping, setShipping] = useState<string>("");
  const [salePrice, setSalePrice] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");

  const selectedProduct = products.find((p) => p.sku === selectedSku);

  // Determine platform fee based on marketplace and ad type
  const platformFeePercent = useMemo(() => {
    if (marketplace === "Mercado Livre") {
      return MERCADO_LIVRE_FEES[adType];
    }
    return 0;
  }, [marketplace, adType]);

  // Calculate profit and margin
  const calculations = useMemo(() => {
    if (!selectedProduct || !salePrice) {
      return null;
    }

    const salePriceNum = parseFloat(salePrice) || 0;
    const shippingNum = parseFloat(shipping) || 0;
    const quantityNum = parseInt(quantity) || 1;
    const cost = selectedProduct.cost;

    const totalRevenue = salePriceNum * quantityNum;
    const platformFeeValue = (platformFeePercent / 100) * totalRevenue;
    const totalCost = cost * quantityNum;
    const netProfit = totalRevenue - totalCost - platformFeeValue - shippingNum;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      platformFeeValue,
      totalCost,
      netProfit,
      margin,
    };
  }, [selectedProduct, salePrice, shipping, quantity, platformFeePercent]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <MainLayout>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Calculator className="h-6 w-6" />
          Calculadora de Lucro
        </h1>
        <p className="page-subtitle">
          Simule a margem e o lucro de uma venda antes de realizá-la
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Simulação</CardTitle>
            <CardDescription>
              Preencha os campos para calcular o lucro e a margem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label htmlFor="product">Produto</Label>
              <Select value={selectedSku} onValueChange={setSelectedSku}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.sku} value={product.sku}>
                      {product.sku} - {formatCurrency(product.cost)} (custo médio)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Marketplace Selection */}
            <div className="space-y-2">
              <Label htmlFor="marketplace">Marketplace</Label>
              <Select value={marketplace} onValueChange={setMarketplace}>
                <SelectTrigger id="marketplace">
                  <SelectValue placeholder="Selecione o marketplace" />
                </SelectTrigger>
                <SelectContent>
                  {MARKETPLACES.map((mp) => (
                    <SelectItem key={mp} value={mp}>
                      {mp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ad Type - Only shown for Mercado Livre */}
            {marketplace === "Mercado Livre" && (
              <div className="space-y-2">
                <Label htmlFor="adType">Tipo de Anúncio</Label>
                <Select value={adType} onValueChange={(v) => setAdType(v as AdType)}>
                  <SelectTrigger id="adType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classico">Clássico (13%)</SelectItem>
                    <SelectItem value="premium">Premium (18%)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Taxa para categoria Eletrônicos
                </p>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
              />
            </div>

            {/* Sale Price */}
            <div className="space-y-2">
              <Label htmlFor="salePrice">Preço de Venda (unitário)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="0,00"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Shipping */}
            <div className="space-y-2">
              <Label htmlFor="shipping">Frete</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="shipping"
                  type="number"
                  step="0.01"
                  min="0"
                  value={shipping}
                  onChange={(e) => setShipping(e.target.value)}
                  placeholder="0,00"
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {selectedProduct && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Produto Selecionado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">SKU</p>
                    <p className="font-medium">{selectedProduct.sku}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Categoria</p>
                    <p className="font-medium">{selectedProduct.category || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Custo Médio</p>
                    <p className="font-medium">{formatCurrency(selectedProduct.cost)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Estoque</p>
                    <p className="font-medium">{selectedProduct.stock} unid.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {calculations ? (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Resultado da Simulação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Receita Total</p>
                    <p className="text-lg font-semibold">{formatCurrency(calculations.totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Custo Total</p>
                    <p className="text-lg font-semibold">{formatCurrency(calculations.totalCost)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Taxa da Plataforma ({platformFeePercent}%)</p>
                    <p className="text-lg font-semibold text-warning">{formatCurrency(calculations.platformFeeValue)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Frete</p>
                    <p className="text-lg font-semibold text-warning">{formatCurrency(parseFloat(shipping) || 0)}</p>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                      </div>
                      <p className={`text-2xl font-bold ${calculations.netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                        {formatCurrency(calculations.netProfit)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Margem de Venda</p>
                      </div>
                      <p className={`text-2xl font-bold ${calculations.margin >= 10 ? "text-success" : calculations.margin >= 0 ? "text-warning" : "text-destructive"}`}>
                        {calculations.margin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Calculator className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-center">
                  Selecione um produto e preencha os campos para ver o resultado da simulação
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
