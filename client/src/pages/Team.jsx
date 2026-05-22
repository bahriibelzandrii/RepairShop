import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Table } from '../components/ui/Table';
import { Button, Input, Label, Select } from '../components/ui/Forms';
import { Modal } from '../components/ui/Modal';
import { useToastStore } from '../store/toastStore';
import { Badge } from '../components/ui/Badges';
import { useAuthStore } from '../store/authStore';
import { useConfirmStore } from '../store/confirmStore';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, Filter, X } from 'lucide-react';

export default function Team() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  const { showConfirm } = useConfirmStore();

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', role: 'employee'
  });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Оновлюємо, але без пароля
        await api.put(`/users/${editingId}`, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role
        });
        addToast('Співробітника успішно оновлено', 'success');
      } else {
        await api.post('/users', formData);
        addToast('Співробітника успішно додано', 'success');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', email: '', password: '', phone: '', role: 'employee' });
      fetchUsers();
    } catch (error) {
      addToast(error.response?.data?.message || 'Помилка', 'error');
    }
  };

  const handleEdit = (u) => {
    setEditingId(u.id);
    setFormData({
      name: u.name,
      email: u.email,
      password: '', // пароль не редагується
      phone: u.phone || '',
      role: u.role
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (id === user?.id) {
      addToast('Ви не можете видалити власний акаунт', 'error');
      return;
    }
    showConfirm('Ви впевнені, що хочете видалити цього співробітника?', async () => {
      try {
        await api.delete(`/users/${id}`);
        addToast('Співробітника видалено', 'success');
        fetchUsers();
      } catch (error) {
        addToast(error.response?.data?.message || 'Помилка видалення', 'error');
      }
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', email: '', password: '', phone: '', role: 'employee' });
  };

  const clearFilters = () => {
    setFilterSearch('');
    setFilterRole('');
  };

  const hasActiveFilters = filterSearch || filterRole;

  const filteredUsers = users.filter(u => {
    if (filterRole && u.role !== filterRole) return false;
    if (filterSearch) {
      const search = filterSearch.toLowerCase();
      const matchName = u.name.toLowerCase().includes(search);
      const matchEmail = u.email.toLowerCase().includes(search);
      const matchPhone = (u.phone || '').toLowerCase().includes(search);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  const columns = [
    { key: 'name', label: 'Ім`я' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Телефон' },
    { 
      key: 'role', 
      label: 'Роль',
      render: (val) => {
        const labels = { admin: 'Адміністратор', employee: 'Майстер', client: 'Клієнт' };
        const variants = { admin: 'destructive', employee: 'primary', client: 'default' };
        return <Badge variant={variants[val]}>{labels[val]}</Badge>;
      }
    },
    { key: 'created_at', label: 'Додано', render: (val) => format(new Date(val), 'dd.MM.yyyy') },
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
          {row.id !== user?.id && (
            <button onClick={() => handleDelete(row.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Видалити">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Персонал та Користувачі</h1>
        <div className="flex gap-3">
          <Button variant={showFilters ? 'default' : 'outline'} onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} className="mr-2" /> Фільтри
            {hasActiveFilters && <span className="ml-2 h-2 w-2 rounded-full bg-primary inline-block" />}
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} className="mr-2" /> Додати співробітника
          </Button>
        </div>
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Пошук</label>
              <input
                type="text"
                className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm"
                placeholder="Ім'я, email або телефон..."
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Роль</label>
              <select
                className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm"
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
              >
                <option value="">Усі ролі</option>
                <option value="admin">Адміністратор</option>
                <option value="employee">Майстер</option>
                <option value="client">Клієнт</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <Table columns={columns} data={filteredUsers} />

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Редагувати співробітника" : "Новий співробітник"}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Ім'я (ПІБ)</Label>
            <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          {!editingId && (
            <div>
              <Label>Пароль</Label>
              <Input type="password" required={!editingId} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Телефон</Label>
              <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div>
              <Label>Роль</Label>
              <Select 
                options={[
                  {value: 'employee', label: 'Майстер'},
                  {value: 'admin', label: 'Адміністратор'},
                ]}
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value})} 
              />
            </div>
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
