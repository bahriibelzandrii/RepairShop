import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Table } from '../components/ui/Table';
import { Button, Input, Label, Select } from '../components/ui/Forms';
import { Modal } from '../components/ui/Modal';
import { FileUpload } from '../components/ui/FileUpload';
import { useToastStore } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';
import { useConfirmStore } from '../store/confirmStore';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  const { showConfirm } = useConfirmStore();

  const [formData, setFormData] = useState({
    client_id: '', serial_or_model: '', brand: '', model: '', color: '', photos: []
  });

  const fetchData = async () => {
    try {
      const [devRes, cliRes] = await Promise.all([
        api.get('/devices'), api.get('/clients')
      ]);
      setDevices(devRes.data);
      setClients(cliRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/devices/${editingId}`, formData);
        addToast('Пристрій успішно оновлено', 'success');
      } else {
        await api.post('/devices', formData);
        addToast('Пристрій успішно додано', 'success');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ client_id: '', serial_or_model: '', brand: '', model: '', color: '', photos: [] });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (device) => {
    setEditingId(device.id);
    setFormData({
      client_id: device.client_id,
      serial_or_model: device.serial_or_model,
      brand: device.brand,
      model: device.model,
      color: device.color || '',
      photos: device.photos || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    showConfirm('Ви впевнені, що хочете видалити цей пристрій? Це також видалить пов`язані замовлення!', async () => {
      try {
        await api.delete(`/devices/${id}`);
        addToast('Пристрій видалено', 'success');
        fetchData();
      } catch (error) {
        console.error(error);
      }
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ client_id: '', serial_or_model: '', brand: '', model: '', color: '', photos: [] });
  };

  const columns = [
    { key: 'brand', label: 'Бренд' },
    { key: 'model', label: 'Модель' },
    { key: 'serial_or_model', label: 'S/N' },
    { key: 'client', label: 'Власник', render: (_, row) => `${row.first_name} ${row.last_name}` },
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
        <h1 className="text-3xl font-bold tracking-tight">Пристрої</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={16} className="mr-2" /> Додати пристрій
        </Button>
      </div>

      <Table columns={columns} data={devices} />

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Редагувати пристрій" : "Новий пристрій"}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Клієнт-власник</Label>
            <Select 
              required
              options={clients.map(c => ({ value: c.id, label: `${c.first_name} ${c.last_name}` }))}
              value={formData.client_id}
              onChange={e => setFormData({...formData, client_id: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Бренд</Label>
              <Input required value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
            </div>
            <div>
              <Label>Модель</Label>
              <Input required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Серійний номер</Label>
              <Input required value={formData.serial_or_model} onChange={e => setFormData({...formData, serial_or_model: e.target.value})} />
            </div>
            <div>
              <Label>Колір</Label>
              <Input value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
            </div>
          </div>
          <div>
            <Label>Фото пристрою (опціонально)</Label>
            <FileUpload 
              value={formData.photos} 
              onChange={photos => setFormData({...formData, photos})} 
              maxFiles={3} 
            />
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
