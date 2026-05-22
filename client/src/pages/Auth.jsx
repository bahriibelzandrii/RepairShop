import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { loginSchema, registerSchema } from '../lib/schemas';
import api from '../lib/axios';
import { Input, Button, Label } from '../components/ui/Forms';
import { Wrench } from 'lucide-react';

export default function Auth({ isRegister = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isRegister) {
        await api.post('/auth/register', data);
        addToast('Реєстрація успішна! Тепер увійдіть.', 'success');
        navigate('/login');
      } else {
        const res = await api.post('/auth/login', data);
        setAuth(res.data.user, res.data.accessToken);
        addToast('Ви успішно увійшли.', 'success');
        
        // Redirect logic based on role
        if (res.data.user.role === 'client') {
          navigate('/my-orders');
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (error) {
      if (error.response?.status === 400) {
        addToast(error.response.data.message || 'Помилка валідації', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md p-8 bg-card rounded-2xl shadow-xl border border-border">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
            <Wrench size={24} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {isRegister ? 'Створити акаунт' : 'Увійдіть в систему'}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {isRegister ? 'Заповніть форму для доступу' : 'Введіть свої дані для входу'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <Label htmlFor="name">Ім'я</Label>
                <Input id="name" {...register('name')} error={errors.name} placeholder="Іван Іванов" />
              </div>
              <div>
                <Label htmlFor="phone">Телефон</Label>
                <Input id="phone" {...register('phone')} error={errors.phone} placeholder="+380..." />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} error={errors.email} placeholder="admin@repair.shop" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="mb-0" htmlFor="password">Пароль</Label>
              {!isRegister && <a href="#" className="text-xs text-primary hover:underline">Забули пароль?</a>}
            </div>
            <Input id="password" type="password" {...register('password')} error={errors.password} placeholder="••••••••" />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Зачекайте...' : (isRegister ? 'Зареєструватися' : 'Увійти')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {isRegister ? 'Вже є акаунт? ' : 'Немає акаунту? '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate(isRegister ? '/login' : '/register');
            }}
            className="text-primary font-medium hover:underline"
          >
            {isRegister ? 'Увійти' : 'Зареєструватися'}
          </a>
        </div>
      </div>
    </div>
  );
}
