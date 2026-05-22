import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email("Невірний формат email"),
  password: z.string().min(1, "Введіть пароль"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Мінімум 2 символи"),
  email: z.string().email("Невірний формат email"),
  phone: z.string().optional(),
  password: z.string().min(6, "Мінімум 6 символів"),
});

export const clientSchema = z.object({
  first_name: z.string().min(2, "Введіть ім'я"),
  last_name: z.string().min(2, "Введіть прізвище"),
  phone: z.string().min(10, "Невірний формат телефону"),
  email: z.string().email("Невірний формат email").optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const deviceSchema = z.object({
  client_id: z.string().min(1, "Оберіть клієнта"),
  brand: z.string().min(2, "Введіть бренд"),
  model: z.string().min(2, "Введіть модель"),
  serial_or_model: z.string().min(2, "Введіть серійний номер"),
  color: z.string().optional(),
});

export const orderItemSchema = z.object({
  type: z.enum(['labor', 'part', 'service', 'warranty']),
  name: z.string().min(2, "Введіть назву послуги/деталі"),
  quantity: z.coerce.number().min(1, "Мінімум 1"),
  unit_price: z.coerce.number().min(0, "Не може бути від'ємним"),
  discount_percent: z.coerce.number().min(0).max(100).optional(),
});
