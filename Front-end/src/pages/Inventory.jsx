import { useState, useEffect } from 'react';
import { Tags, Download, Plus, ChevronDown, Pencil, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import api from '../services/api';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const getStockStatus = (product) => {
  const stock = product.stock || 0;
  const min = product.min_stock || 0;
  if (stock <= 0) return 'out';
  if (stock <= min) return 'low';
  return 'ok';
};

const STOCK_STYLE = {
  ok: { dot: 'bg-accent', badge: 'bg-bg border border-border text-white' },
  low: { dot: 'bg-accent', badge: 'bg-accent/10 border border-accent text-accent' },
  out: { dot: 'bg-error', badge: 'bg-error/10 border border-error text-error' },
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [showCategories, setShowCategories] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [loadError, setLoadError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [listError, setListError] = useState('');
  const perPage = 20;

  const fetchData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
      ]);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      setCategories(catRes.data?.data || []);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Error al cargar el inventario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function load() { await fetchData(); }
    load();
  }, []);

  const filtered = products.filter((p) => {
    if (categoryFilter !== 'all' && p.category?.name !== categoryFilter) return false;
    const status = getStockStatus(p);
    if (stockFilter !== 'all' && status !== stockFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    setCategoryError('');
    try {
      await api.post('/categories', { name: newCategory.trim() });
      setNewCategory('');
      const res = await api.get('/categories');
      setCategories(res.data?.data || []);
    } catch (err) {
      setCategoryError(err.response?.data?.message || 'Error al agregar la categoría');
    }
  };

  const removeCategory = async (cat) => {
    setCategoryError('');
    try {
      await api.delete(`/categories/${cat.id}`);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (err) {
      setCategoryError(err.response?.data?.message || 'Error al eliminar la categoría');
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    setListError('');
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setListError(err.response?.data?.message || 'Error al eliminar el producto');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary text-sm">Cargando inventario...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[32px] leading-[40px] tracking-tight font-bold text-white mb-1">Catálogo de Inventario</h1>
          <p className="text-sm text-text-secondary">Gestiona productos, niveles de stock y precios de tu tienda.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setCategoryError(''); setShowCategories(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border text-text-secondary text-sm rounded hover:bg-border/30 hover:border-accent transition-colors"
          >
            <Tags size={18} /> Gestionar Categorías
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border text-text-secondary text-sm rounded hover:bg-border/30 hover:border-accent transition-colors">
            <Download size={18} /> Exportar
          </button>
          <button
            onClick={() => { setEditingProduct(null); setShowProductForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent text-bg text-sm rounded hover:opacity-90 transition-colors font-semibold"
          >
            <Plus size={18} /> Agregar Producto
          </button>
        </div>
      </div>

      {loadError && (
        <div className="text-sm text-error bg-error/10 border border-error/30 rounded-lg px-4 py-3">{loadError}</div>
      )}
      {listError && (
        <div className="text-sm text-error bg-error/10 border border-error/30 rounded-lg px-4 py-3">{listError}</div>
      )}

      <div className="bg-surface p-4 rounded-t-lg border border-border border-b-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="appearance-none bg-bg border border-border rounded pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            >
              <option value="all">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={stockFilter}
              onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
              className="appearance-none bg-bg border border-border rounded pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            >
              <option value="all">Estado de Stock</option>
              <option value="ok">En Stock</option>
              <option value="low">Stock Bajo</option>
              <option value="out">Agotado</option>
            </select>
            <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>
        </div>
        <span className="text-sm text-text-secondary">Mostrando {paged.length} de {filtered.length} artículos</span>
      </div>

      <div className="bg-surface border border-border rounded-b-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-border/50 border-b border-border">
              <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">SKU</th>
              <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Producto</th>
              <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Categoría</th>
              <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary">Stock</th>
              <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary text-right">Precio</th>
              <th className="py-3 px-4 text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {paged.map((p) => {
              const status = getStockStatus(p);
              const style = STOCK_STYLE[status];
              const weightUnit = p.saleUnits?.find((u) => u.unit_type === 'weight');
              return (
                <tr key={p.id} className="border-b border-border hover:bg-border/30 transition-colors">
                  <td className="py-4 px-4 font-mono text-text-secondary">{p.sku || p.barcode || `#${p.id}`}</td>
                  <td className="py-4 px-4 font-semibold text-white">{p.name}</td>
                  <td className="py-4 px-4 text-text-secondary">{p.category?.name || '—'}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded font-mono ${style.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {p.stock || 0} unidades{status === 'low' ? ' (Bajo)' : ''}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-mono text-right">
                    {fmt(p.price)}
                    {weightUnit && <div className="text-[11px] text-accent">{fmt(weightUnit.unit_price)}/kg</div>}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => { setEditingProduct(p); setShowProductForm(true); }}
                      className="p-1 text-text-secondary hover:text-accent transition-colors"
                    ><Pencil size={18} /></button>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="p-1 text-text-secondary hover:text-error transition-colors"
                    ><Trash2 size={18} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t border-border bg-surface flex justify-between items-center">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="text-text-secondary hover:text-accent disabled:opacity-50"
            disabled={page <= 1}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded text-sm ${page === p ? 'bg-accent text-bg font-semibold' : 'text-text-secondary hover:bg-border hover:text-white'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="text-text-secondary hover:text-accent disabled:opacity-50"
            disabled={page >= totalPages}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {showCategories && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCategories(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-surface border-l border-border shadow-xl flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-[24px] leading-[32px] font-semibold text-white">Gestionar Categorías</h2>
              <button onClick={() => setShowCategories(false)} className="p-2 text-text-secondary hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <label className="block text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary mb-2">Agregar Nueva Categoría</label>
                <div className="flex gap-3">
                  <input
                    className="flex-1 bg-bg border border-border rounded px-4 py-2.5 text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                    placeholder="Nombre de categoría..."
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                  />
                  <button onClick={addCategory} className="px-4 py-2.5 bg-accent text-bg font-semibold rounded hover:opacity-90 transition-colors">Agregar</button>
                </div>
                {categoryError && <div className="text-sm text-error mt-2">{categoryError}</div>}
              </div>
              <div className="space-y-3">
                <label className="block text-[12px] leading-[16px] tracking-widest uppercase font-bold text-text-secondary mb-2">Categorías Existentes</label>
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-4 bg-bg border border-border rounded">
                    <span className="text-white">{cat.name}</span>
                    <button onClick={() => removeCategory(cat)} className="p-1 text-text-secondary hover:text-error transition-colors"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-border bg-border/30">
              <button onClick={() => setShowCategories(false)} className="w-full py-2.5 bg-surface border border-border text-white font-semibold rounded hover:bg-border/50 transition-colors">Cerrar Panel</button>
            </div>
          </div>
        </div>
      )}

      {showProductForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onClose={() => { setShowProductForm(false); setEditingProduct(null); }}
          onSaved={() => { setShowProductForm(false); setEditingProduct(null); fetchData(); }}
        />
      )}
    </div>
  );
}

function ProductForm({ product, categories, onClose, onSaved }) {
  const weightUnit = product?.saleUnits?.find((u) => u.unit_type === 'weight');
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    purchase_price: product?.purchase_price || '',
    stock: product?.stock ?? '',
    category_id: product?.category?.id || '',
    barcode: product?.barcode || '',
    min_stock: product?.min_stock ?? '',
  });
  const [sellByWeight, setSellByWeight] = useState(!!weightUnit);
  const [pricePerKg, setPricePerKg] = useState(weightUnit?.unit_price || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = {
        ...form,
        price: parseFloat(form.price) || 0,
        purchase_price: parseFloat(form.purchase_price) || 0,
        stock: form.stock !== '' ? parseInt(form.stock) : 0,
        min_stock: form.min_stock !== '' ? parseInt(form.min_stock) : 0,
        category_id: parseInt(form.category_id) || null,
        sale_units: sellByWeight
          ? [{ unit_type: 'weight', unit_price: parseFloat(pricePerKg) || 0 }]
          : [],
      };
      if (product) {
        await api.put(`/products/${product.id}`, body);
      } else {
        await api.post('/products', body);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-lg bg-surface border-l border-border shadow-xl flex flex-col">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-[24px] leading-[32px] font-semibold text-white">{product ? 'Editar' : 'Nuevo'} Producto</h2>
          <button onClick={onClose} className="p-2 text-text-secondary hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {error && <div className="text-sm text-error">{error}</div>}
          <div>
            <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Nombre</label>
            <input className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white focus:border-accent outline-none" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
          </div>
          <div>
            <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Descripción</label>
            <textarea className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white focus:border-accent outline-none resize-none h-20" value={form.description} onChange={(e) => handleChange('description', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">
                Precio Venta{sellByWeight && <span className="normal-case font-normal text-accent"> (por pieza, si aplica)</span>}
              </label>
              <input className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white font-mono focus:border-accent outline-none" type="number" step="0.01" value={form.price} onChange={(e) => handleChange('price', e.target.value)} required />
            </div>
            <div>
              <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">
                Precio Compra{sellByWeight && <span className="normal-case font-normal text-accent"> (por pieza, si aplica)</span>}
              </label>
              <input className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white font-mono focus:border-accent outline-none" type="number" step="0.01" value={form.purchase_price} onChange={(e) => handleChange('purchase_price', e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">
                Stock {sellByWeight && <span className="normal-case font-normal text-accent">(en gramos)</span>}
              </label>
              <input className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white font-mono focus:border-accent outline-none" type="number" value={form.stock} onChange={(e) => handleChange('stock', e.target.value)} />
            </div>
            <div>
              <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Stock Mínimo</label>
              <input className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white font-mono focus:border-accent outline-none" type="number" value={form.min_stock} onChange={(e) => handleChange('min_stock', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Código de Barras</label>
            <input className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white font-mono focus:border-accent outline-none" value={form.barcode} onChange={(e) => handleChange('barcode', e.target.value)} />
          </div>
          <div className="p-3 bg-bg border border-border rounded flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
              <input
                type="checkbox"
                checked={sellByWeight}
                onChange={(e) => setSellByWeight(e.target.checked)}
                className="accent-accent"
              />
              Se vende por peso (gramos/kg)
            </label>
            <p className="text-[11px] text-text-secondary">
              Si este producto se vende ÚNICAMENTE por peso (ej. queso suelto), deja Precio Venta y Precio Compra en 0, y usa el campo Stock para el peso total disponible en gramos.
            </p>
            {sellByWeight && (
              <div>
                <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Precio por Kg</label>
                <input
                  className="w-full bg-surface border border-border rounded px-4 py-2.5 text-sm text-white font-mono focus:border-accent outline-none"
                  type="number"
                  step="0.01"
                  min="0"
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(e.target.value)}
                  placeholder="0.00"
                  required
                />
                <p className="text-[11px] text-text-secondary mt-1">El punto de venta calculará el total según los gramos capturados.</p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-[12px] tracking-widest uppercase font-bold text-text-secondary mb-1">Categoría</label>
            <select className="w-full bg-bg border border-border rounded px-4 py-2.5 text-sm text-white focus:border-accent outline-none" value={form.category_id} onChange={(e) => handleChange('category_id', e.target.value)}>
              <option value="">Sin categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-surface border border-border text-white font-semibold rounded hover:bg-border/50 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-accent text-bg font-semibold rounded hover:opacity-90 transition-colors disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
