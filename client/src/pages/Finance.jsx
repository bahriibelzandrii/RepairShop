import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Forms';
import { Badge } from '../components/ui/Badges';
import { format } from 'date-fns';
import { Download, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { useConfirmStore } from '../store/confirmStore';

export default function Finance() {
  const [transactions, setTransactions] = useState([]);
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const { showConfirm } = useConfirmStore();

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/finance/transactions');
      setTransactions(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const exportCSV = () => {
    const header = ['ID', 'Сума', 'Тип', 'Посилання', 'Дата'];
    const rows = transactions.map(tx => [
      tx.id, tx.amount, tx.type, tx.reference, format(new Date(tx.created_at), 'dd.MM.yyyy HH:mm')
    ]);
    
    const csvContent = [
      header.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `finance_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    { key: 'reference', label: 'Опис' },
    { 
      key: 'type', 
      label: 'Тип', 
      render: (val) => (
        <Badge variant={val === 'charge' ? 'success' : 'destructive'}>
          {val === 'charge' ? 'Надходження' : 'Витрата'}
        </Badge>
      )
    },
    { key: 'amount', label: 'Сума', render: (val) => <span className="font-bold">{val} ₴</span> },
    { key: 'created_at', label: 'Дата', render: (val) => format(new Date(val), 'dd.MM.yyyy HH:mm') },
  ];

  const handleDelete = async (id) => {
    showConfirm('Ви впевнені, що хочете видалити цю транзакцію? Це вплине на баланс пов\'язаного замовлення.', async () => {
      try {
        await api.delete(`/finance/transactions/${id}`);
        addToast('Транзакцію видалено', 'success');
        fetchTransactions();
      } catch (error) {
        addToast(error.response?.data?.message || 'Помилка видалення', 'error');
      }
    });
  };

  if (user?.role === 'admin') {
    columns.push({
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => handleDelete(row.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Видалити">
            <Trash2 size={16} />
          </button>
        </div>
      )
    });
  }

  const totalRevenue = transactions.reduce((sum, tx) => tx.type === 'charge' ? sum + tx.amount : sum - tx.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Фінанси та Звіти</h1>
        <Button onClick={exportCSV} variant="outline">
          <Download size={16} className="mr-2" /> Експорт CSV
        </Button>
      </div>

      <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Загальний баланс</p>
          <h3 className="text-3xl font-bold text-success">{totalRevenue} ₴</h3>
        </div>
      </div>

      <Table columns={columns} data={transactions} />
    </div>
  );
}
