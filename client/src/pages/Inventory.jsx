import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Table } from '../components/ui/Table';
import { Button, Input, Label, Select } from '../components/ui/Forms';
import { Modal } from '../components/ui/Modal';
import { useToastStore } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';
import { useConfirmStore } from '../store/confirmStore';
import { Plus, Filter, X, Edit2, Trash2 } from 'lucide-react';
import { Badge } from '../components/ui/Badges';

const CATEGORY_OPTIONS = [
  { value: '', label: 'Усі категорії' },
  { value: 'part', label: 'Запчастина' },
  { value: 'service', label: 'Послуга' },
  { value: 'accessory', label: 'Аксесуар' },
];

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  const { showConfirm } = useConfirmStore();

  // Фільтри
  const [filterSearch, setFilterSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);

  const [formData, setFormData] = useState({
    name: '', sku: '', category: 'part', price: '', stock_quantity: '', min_stock: ''
  });

  const fetchItems = async () => {
    try {
      const res = await api.get('/inventory');
      setItems(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/inventory/${editingId}`, formData);
        addToast('Позицію оновлено', 'success');
      } else {
        await api.post('/inventory', formData);
        addToast('Позицію додано', 'success');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', sku: '', category: 'part', price: '', stock_quantity: '', min_stock: '' });
      fetchItems();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      sku: item.sku || '',
      category: item.category,
      price: item.price,
      stock_quantity: item.stock_quantity || '',
      min_stock: item.min_stock || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    showConfirm('Ви впевнені, що хочете видалити цю позицію?', async () => {
      try {
        await api.delete(`/inventory/${id}`);
        addToast('Позицію видалено', 'success');
        fetchItems();
      } catch (error) {
        console.error(error);
      }
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', sku: '', category: 'part', price: '', stock_quantity: '', min_stock: '' });
  };

  const clearFilters = () => { setFilterCategory(''); setFilterLowStock(false); setFilterSearch(''); };
  const hasActiveFilters = filterCategory || filterLowStock || filterSearch;

  const filteredItems = items.filter(item => {
    if (filterCategory && item.category !== filterCategory) return false;
    if (filterLowStock) {
      if (item.category === 'service') return false; // Послуги не мають залишку, тому не показуємо їх у режимі "низький запас"
      if (item.stock_quantity > item.min_stock) return false;
    }
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      const matchName = item.name?.toLowerCase().includes(q);
      const matchSku = item.sku?.toLowerCase().includes(q);
      if (!matchName && !matchSku) return false;
    }
    return true;
  });

  const columns = [
    { key: 'sku', label: 'SKU / Код' },
    { key: 'name', label: 'Назва' },
    { 
      key: 'category', label: 'Категорія',
      render: (val) => {
        const labels = { part: 'Запчастина', service: 'Послуга', accessory: 'Аксесуар' };
        return <Badge variant={val === 'service' ? 'primary' : val === 'accessory' ? 'warning' : 'default'}>{labels[val]}</Badge>;
      }
    },
    { key: 'price', label: 'Ціна', render: (val) => `${val} ₴` },
    { 
      key: 'stock_quantity', label: 'Залишок',
      render: (val, row) => (
        <span className={row.category !== 'service' && val <= row.min_stock ? 'text-destructive font-bold' : ''}>
          {row.category === 'service' ? '∞' : val}
        </span>
      )
    },
    { key: 'min_stock', label: 'Мін.', render: (val, row) => row.category === 'service' ? '—' : val },
  ];

  if (user?.role === 'admin') {
    columns.push({
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => handleEdit(row)} className="text-muted-foreground hover:text-primary transition-colors p-1" title="Редагувати">
            <Edit2 size={16} />
          </button>
          <button onClick={() => handleDelete(row.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Видалити">
            <Trash2 size={16} />
          </button>
        </div>
      )
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Склад та Послуги</h1>
        <div className="flex items-center gap-3">
          <Button variant={showFilters ? 'default' : 'outline'} onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} className="mr-2" /> Фільтри
            {hasActiveFilters && <span className="ml-2 h-2 w-2 rounded-full bg-primary inline-block" />}
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} className="mr-2" /> Додати позицію
          </Button>
        </div>
      </div>

      {/* Панель фільтрів */}
      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Фільтри</h4>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-destructive hover:underline flex items-center gap-1">
                <X size={12} /> Скинути
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-grow max-w-xs min-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1 block">Пошук</label>
              <Input 
                placeholder="Пошук за назвою чи SKU..." 
                value={filterSearch} 
                onChange={e => setFilterSearch(e.target.value)} 
                className="h-9"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Категорія</label>
              <select className="h-9 px-3 rounded-md border border-border bg-background text-sm"
                value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-background text-sm cursor-pointer">
              <input type="checkbox" checked={filterLowStock} onChange={e => setFilterLowStock(e.target.checked)}
                className="rounded border-border" />
              Тільки з низьким запасом
            </label>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Показано: <strong>{filteredItems.length}</strong> з {items.length}
          </p>
        </div>
      )}

      <Table columns={columns} data={filteredItems} />

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Редагувати позицію" : "Нова позиція"}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Назва</Label>
            <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Категорія</Label>
              <Select options={[{value:'part',label:'Запчастина'},{value:'service',label:'Послуга'},{value:'accessory',label:'Аксесуар'}]}
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
            </div>
            <div>
              <Label>Артикул / SKU</Label>
              <Input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
            </div>
          </div>
          <div>
            <Label>Ціна (₴)</Label>
            <Input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
          </div>
          {formData.category !== 'service' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Кількість на складі</Label>
                <Input type="number" required value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value})} />
              </div>
              <div>
                <Label>Мін. залишок</Label>
                <Input type="number" value={formData.min_stock} onChange={e => setFormData({...formData, min_stock: e.target.value})} />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={closeModal}>Скасувати</Button>
            <Button type="submit">Зберегти</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
