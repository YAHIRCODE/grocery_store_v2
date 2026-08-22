import { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingDown, Search } from 'lucide-react';
import api from '../../services/api';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function ProductsReport() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/dashboard/reportes/productos')
      .then((res) => setProducts(res.data?.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.category?.name?.toLowerCase().includes(q) ||
      String(p.barcode).includes(q)
    );
  });

  const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);
  const lowStockCount = products.filter((p) => p.stock <= p.min_stock && p.stock > 0).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const totalValue = products.reduce((s, p) => s + (p.stock || 0) * (p.purchase_price || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-[32px] leading-[40px] tracking-tight font-bold text-white">Reporte de Productos</h2>
          <p className="text-sm text-text-secondary mt-1">{products.length} productos en inventario, ordenados por stock.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            className="bg-bg border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all placeholder:text-text-secondary/50 w-64"
            placeholder="Buscar producto, categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-lg border border-border hover:border-accent transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">Total</span>
            <Package size={20} className="text-text-secondary group-hover:text-accent transition-colors" />
          </div>
          <div className="font-mono text-[32px] leading-[40px] tracking-tight text-white">{products.length}</div>
          <div className="text-sm text-text-secondary mt-1">Productos activos</div>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-border hover:border-accent transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">Unidades</span>
            <Package size={20} className="text-text-secondary group-hover:text-accent transition-colors" />
          </div>
          <div className="font-mono text-[32px] leading-[40px] tracking-tight text-white">{totalStock.toLocaleString()}</div>
          <div className="text-sm text-text-secondary mt-1">En existencia</div>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-border hover:border-error transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">Stock Bajo</span>
            <TrendingDown size={20} className="text-error group-hover:text-error transition-colors" />
          </div>
          <div className="font-mono text-[32px] leading-[40px] tracking-tight text-error">{lowStockCount + outOfStock}</div>
          <div className="text-sm text-text-secondary mt-1">{outOfStock} sin stock, {lowStockCount} por debajo</div>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-border hover:border-accent transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural">Valor Inventario</span>
            <Package size={20} className="text-text-secondary group-hover:text-accent transition-colors" />
          </div>
          <div className="font-mono text-[32px] leading-[40px] tracking-tight text-white">{fmt(totalValue)}</div>
          <div className="text-sm text-text-secondary mt-1">Costo de compra total</div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-secondary text-sm">Cargando productos...</div>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="bg-border/30 px-6 py-3 grid grid-cols-12 gap-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-structural border-b border-border">
            <div className="col-span-3">Producto</div>
            <div className="col-span-2">Categoría</div>
            <div className="col-span-1 text-right">Stock</div>
            <div className="col-span-1 text-right">Mínimo</div>
            <div className="col-span-2 text-right">P. Compra</div>
            <div className="col-span-2 text-right">P. Venta</div>
            <div className="col-span-1 text-center">Estado</div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-text-secondary">No hay productos{search ? ' que coincidan con la búsqueda' : ''}</div>
          ) : (
            filtered.map((p) => {
              const isOut = p.stock === 0;
              const isLow = p.stock > 0 && p.stock <= p.min_stock;
              const margin = p.purchase_price > 0 ? ((p.price - p.purchase_price) / p.purchase_price * 100).toFixed(1) : 0;
              return (
                <div
                  key={p.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/50 hover:bg-border/20 transition-colors items-center"
                >
                  <div className="col-span-3">
                    <div className="text-sm text-white font-medium truncate">{p.name}</div>
                    {p.barcode && <div className="text-xs text-text-secondary font-mono">{p.barcode}</div>}
                  </div>
                  <div className="col-span-2 text-sm text-text-secondary truncate">{p.category?.name || 'Sin categoría'}</div>
                  <div className={`col-span-1 text-right font-mono text-sm font-bold ${isOut ? 'text-error' : isLow ? 'text-error' : 'text-white'}`}>
                    {p.stock}
                  </div>
                  <div className="col-span-1 text-right font-mono text-sm text-text-secondary">{p.min_stock}</div>
                  <div className="col-span-2 text-right font-mono text-sm text-text-secondary">{fmt(p.purchase_price)}</div>
                  <div className="col-span-2 text-right font-mono text-sm text-accent">{fmt(p.price)}</div>
                  <div className="col-span-1 text-center">
                    {isOut ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-error/10 text-error border border-error/30">Sin Stock</span>
                    ) : isLow ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-error/10 text-error border border-error/30">Bajo</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/10 text-accent border border-accent/30">OK</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
