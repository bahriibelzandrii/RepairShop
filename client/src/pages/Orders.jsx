import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { Table } from '../components/ui/Table';
import { Button, Input, Label, Select } from '../components/ui/Forms';
import { Modal } from '../components/ui/Modal';
import { useToastStore } from '../store/toastStore';
import { StatusBadge, PaymentBadge } from '../components/ui/Badges';
import { format } from 'date-fns';
import { Plus, Filter, X, Edit2, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useConfirmStore } from '../store/confirmStore';

const STATUS_OPTIONS = [
  { value: '', label: 'Усі статуси' },
  { value: 'received', label: 'Отримано' },
  { value: 'diagnostics', label: 'Діагностика' },
  { value: 'in_progress', label: 'В роботі' },
  { value: 'waiting_parts', label: 'Очікує деталі' },
  { value: 'ready', label: 'Готово' },
  { value: 'delivered', label: 'Видано' },
  { value: 'cancelled', label: 'Скасовано' },
];

const PAYMENT_OPTIONS = [
  { value: '', label: 'Усі оплати' },
  { value: 'unpaid', label: 'Не оплачено' },
  { value: 'partial', label: 'Частково' },
  { value: 'paid', label: 'Оплачено' },
];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [devices, setDevices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  const { showConfirm } = useConfirmStore();

  // Фільтри
  const [filterMode, setFilterMode] = useState('all');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterMaster, setFilterMaster] = useState('');

  const [formData, setFormData] = useState({ client_id: '', device_id: '', expected_delivery_at: '' });

  const fetchInitialData = async () => {
    try {
      const [ordRes, cliRes, devRes] = await Promise.all([
        api.get('/orders'), api.get('/clients'), api.get('/devices')
      ]);
      setOrders(ordRes.data);
      setClients(cliRes.data);
      setDevices(devRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchInitialData(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/orders/${editingId}`, formData);
        addToast('Замовлення оновлено', 'success');
      } else {
        await api.post('/orders', formData);
        addToast('Замовлення створено', 'success');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ client_id: '', device_id: '', expected_delivery_at: '' });
      fetchInitialData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (e, order) => {
    e.stopPropagation();
    setEditingId(order.id);
    setFormData({
      client_id: order.client_id,
      device_id: order.device_id,
      expected_delivery_at: order.expected_delivery_at ? order.expected_delivery_at.split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    showConfirm('Ви впевнені, що хочете видалити це замовлення? Усі його позиції та платежі будуть видалені!', async () => {
      try {
        await api.delete(`/orders/${id}`);
        addToast('Замовлення видалено', 'success');
        fetchInitialData();
      } catch (error) {
        console.error(error);
      }
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ client_id: '', device_id: '', expected_delivery_at: '' });
  };

  const clearFilters = () => {
    setFilterStatus('');
    setFilterPayment('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterMaster('');
    setFilterMode('all');
  };

  const hasActiveFilters = filterStatus || filterPayment || filterDateFrom || filterDateTo || filterMaster || filterMode === 'my';

  // Унікальні майстри для фільтра
  const uniqueMasters = [...new Map(
    orders.filter(o => o.assigned_master).map(o => [o.assigned_to, o.assigned_master])
  ).entries()].map(([id, name]) => ({ value: id, label: name }));

  // Застосування фільтрів
  const filteredOrders = orders.filter(o => {
    if (filterMode === 'my' && o.assigned_to !== user?.id) return false;
    if (filterStatus && o.status !== filterStatus) return false;
    if (filterPayment && o.payment_status !== filterPayment) return false;
    if (filterMaster && o.assigned_to !== filterMaster) return false;
    if (filterDateFrom && new Date(o.created_at) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(o.created_at) > new Date(filterDateTo + 'T23:59:59')) return false;
    return true;
  });

  const columns = [
    { key: 'order_number', label: 'Номер' },
    { key: 'client_name', label: 'Клієнт', render: (_, row) => `${row.first_name} ${row.last_name}` },
    { key: 'device', label: 'Пристрій', render: (_, row) => `${row.brand} ${row.model}` },
    { key: 'status', label: 'Статус', render: (val) => <StatusBadge status={val} /> },
    { key: 'payment_status', label: 'Оплата', render: (val) => <PaymentBadge status={val} /> },
    { key: 'assigned_master', label: 'Майстер', render: (val) => val || <span className="text-muted-foreground">—</span> },
    { key: 'created_at', label: 'Дата', render: (val) => format(new Date(val), 'dd.MM.yyyy') },
  ];

  if (user?.role === 'admin') {
    columns.push({
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex gap-2 justify-end">
          <button onClick={(e) => handleEdit(e, row)} className="text-muted-foreground hover:text-primary transition-colors p-1" title="Редагувати">
            <Edit2 size={16} />
          </button>
          <button onClick={(e) => handleDelete(e, row.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Видалити">
            <Trash2 size={16} />
          </button>
        </div>
      )
    });
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Замовлення</h1>
        <div className="flex items-center gap-3">
          {user?.role === 'employee' && (
            <div className="flex bg-muted p-1 rounded-md">
              <button className={`px-3 py-1 text-sm rounded-md transition-colors ${filterMode === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                onClick={() => setFilterMode('all')}>Всі</button>
              <button className={`px-3 py-1 text-sm rounded-md transition-colors ${filterMode === 'my' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                onClick={() => setFilterMode('my')}>Призначені мені</button>
            </div>
          )}
          <Button variant={showFilters ? 'default' : 'outline'} onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} className="mr-2" /> Фільтри
            {hasActiveFilters && <span className="ml-2 h-2 w-2 rounded-full bg-primary inline-block" />}
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} className="mr-2" /> Нове замовлення
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
                <X size={12} /> Скинути всі
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Статус</label>
              <select className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm"
                value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Оплата</label>
              <select className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm"
                value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
                {PAYMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Майстер</label>
              <select className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm"
                value={filterMaster} onChange={e => setFilterMaster(e.target.value)}>
                <option value="">Усі майстри</option>
                {uniqueMasters.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Дата від</label>
              <input type="date" className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm"
                value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Дата до</label>
              <input type="date" className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm"
                value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Показано: <strong>{filteredOrders.length}</strong> з {orders.length} замовлень
          </p>
        </div>
      )}

      <Table columns={columns} data={filteredOrders} onRowClick={(row) => navigate(`/orders/${row.id}`)} />

      {/* Модалка створення */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Редагувати замовлення" : "Створити замовлення"}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Клієнт</Label>
            <Select required
              options={clients.map(c => ({ value: c.id, label: `${c.first_name} ${c.last_name} (${c.phone})` }))}
              value={formData.client_id}
              onChange={e => setFormData({...formData, client_id: e.target.value, device_id: ''})} />
          </div>
          <div>
            <Label>Пристрій</Label>
            <Select required disabled={!formData.client_id}
              options={devices.filter(d => String(d.client_id) === String(formData.client_id)).map(d => ({ value: d.id, label: `${d.brand} ${d.model}` }))}
              value={formData.device_id}
              onChange={e => setFormData({...formData, device_id: e.target.value})} />
            {!formData.client_id && <p className="text-xs text-muted-foreground mt-1">Спочатку оберіть клієнта</p>}
          </div>
          <div>
            <Label>Очікувана дата видачі</Label>
            <Input type="date" value={formData.expected_delivery_at} onChange={e => setFormData({...formData, expected_delivery_at: e.target.value})} />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={closeModal}>Скасувати</Button>
            <Button type="submit">Зберегти</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
