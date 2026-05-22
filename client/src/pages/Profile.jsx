import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { Button, Input, Label } from '../components/ui/Forms';
import { Badge } from '../components/ui/Badges';
import { User, Mail, Phone, Shield, Calendar, Edit2, Check, X } from 'lucide-react';
import { format } from 'date-fns';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/me');
        setProfile(res.data);
        setFormData({ name: res.data.name, phone: res.data.phone || '' });
      } catch (error) {
        console.error(error);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const res = await api.put('/users/me', formData);
      setProfile(res.data.user);
      updateUser({ ...user, name: res.data.user.name }); // Оновлюємо стан авторизації
      setIsEditing(false);
      addToast('Профіль оновлено', 'success');
    } catch (error) {
      addToast('Помилка оновлення', 'error');
    }
  };

  if (!profile) return null;

  const roleLabels = { admin: 'Адміністратор', employee: 'Майстер', client: 'Клієнт' };
  const roleVariants = { admin: 'destructive', employee: 'primary', client: 'default' };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">Мій профіль</h1>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-muted/50 p-6 flex justify-between items-start border-b border-border">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-md">
              {profile.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              {isEditing ? (
                <div className="mb-2">
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="text-lg font-bold py-1 h-auto"
                  />
                </div>
              ) : (
                <h2 className="text-2xl font-bold mb-1">{profile.name}</h2>
              )}
              <Badge variant={roleVariants[profile.role]}>{roleLabels[profile.role]}</Badge>
            </div>
          </div>
          <div>
            {isEditing ? (
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => { setIsEditing(false); setFormData({ name: profile.name, phone: profile.phone || '' }); }}>
                  <X size={18} className="text-muted-foreground" />
                </Button>
                <Button size="icon" onClick={handleSave}>
                  <Check size={18} />
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 size={16} className="mr-2" /> Редагувати
              </Button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground flex items-center gap-2 mb-2"><Mail size={16} /> Email</span>
              <p className="font-medium text-lg">{profile.email}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground flex items-center gap-2 mb-2"><Phone size={16} /> Телефон</span>
              {isEditing ? (
                <Input 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  placeholder="+380..."
                />
              ) : (
                <p className="font-medium text-lg">{profile.phone || 'Не вказано'}</p>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground flex items-center gap-2 mb-2"><Shield size={16} /> Роль в системі</span>
              <p className="font-medium text-lg">{roleLabels[profile.role]}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground flex items-center gap-2 mb-2"><Calendar size={16} /> Дата реєстрації</span>
              <p className="font-medium text-lg">{format(new Date(profile.created_at), 'dd.MM.yyyy')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
