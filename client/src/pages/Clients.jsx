import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../lib/axios';
import { Table } from '../components/ui/Table';
import { Button, Input, Label, Textarea } from '../components/ui/Forms';
import { Modal } from '../components/ui/Modal';
import { useToastStore } from '../store/toastStore';
import { clientSchema } from '../lib/schemas';
import { useAuthStore } from '../store/authStore';
import { useConfirmStore } from '../store/confirmStore';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  const { showConfirm } = useConfirmStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(clientSchema)
  });

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const onSubmit = async (data) => {
    try {
      if (editingId) {
        await api.put(`/clients/${editingId}`, data);
        addToast('Клієнта успішно оновлено', 'success');
      } else {
        await api.post('/clients', data);
        addToast('Клієнта успішно додано', 'success');
      }
      setIsModalOpen(false);
      setEditingId(null);
      reset();
      fetchClients();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (client) => {
    setEditingId(client.id);
    reset({
      first_name: client.first_name,
      last_name: client.last_name,
      phone: client.phone,
      email: client.email || '',
      address: client.address || '',
      notes: client.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    showConfirm('Ви впевнені, що хочете видалити цього клієнта? Усі його пристрої та замовлення також будуть видалені!', async () => {
      try {
        await api.delete(`/clients/${id}`);
        addToast('Клієнта видалено', 'success');
        fetchClients();
      } catch (error) {
        console.error(error);
      }
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    reset();
  };

  const columns = [
    { key: 'first_name', label: 'Ім`я' },
    { key: 'last_name', label: 'Прізвище' },
    { key: 'phone', label: 'Телефон' },
    { key: 'email', label: 'Email' },
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
        <h1 className="text-3xl font-bold tracking-tight">Клієнти</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={16} className="mr-2" /> Додати клієнта
        </Button>
      </div>

      <Table columns={columns} data={clients} />

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Редагувати клієнта" : "Новий клієнт"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ім'я</Label>
              <Input {...register('first_name')} error={errors.first_name} />
            </div>
            <div>
              <Label>Прізвище</Label>
              <Input {...register('last_name')} error={errors.last_name} />
            </div>
          </div>
          <div>
            <Label>Телефон</Label>
            <Input {...register('phone')} error={errors.phone} />
          </div>
          <div>
            <Label>Email (необов'язково)</Label>
            <Input type="email" {...register('email')} error={errors.email} />
          </div>
          <div>
            <Label>Адреса</Label>
            <Input {...register('address')} error={errors.address} />
          </div>
          <div>
            <Label>Примітки</Label>
            <Textarea {...register('notes')} error={errors.notes} />
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
