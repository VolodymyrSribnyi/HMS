import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/axios';
import { useAuthStore } from './stores/authStore';

// 1. Описуємо схему валідації за допомогою Zod
const loginSchema = z.object({
  email: z.string().min(1, 'An email is required'),
  password: z.string().min(6, 'The password must contain at least 6 characters'),
});

// 2. TypeScript-магія: автоматично витягуємо типи зі схеми Zod
type LoginFormInputs = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  // Дістаємо функцію для збереження токена в пам'ять (Zustand)
  const setToken = useAuthStore((state) => state.setToken);
  
  // Стейт для помилок від самого бекенду (наприклад, "Неправильний пароль")
  const [serverError, setServerError] = useState<string | null>(null);

  // 3. Підключаємо React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema), // Вказуємо, що валідувати треба через Zod
  });

  // 4. Функція, яка викличеться ТІЛЬКИ якщо валідація Zod пройде успішно
  const onSubmit = async (data: LoginFormInputs) => {
    try {
      setServerError(null); // Очищаємо попередні помилки

      // Відправляємо POST запит на твій .NET бекенд
      const response = await apiClient.post('/auth/login', data);

      // Припускаємо, що твій бекенд повертає { accessToken: "eyJhbG..." }
      const token = response.data.accessToken;

      // Зберігаємо токен у БЕЗПЕЧНУ ПАМ'ЯТЬ (Zustand)
      setToken(token);

      // Перенаправляємо юзера на захищену сторінку
      navigate('/dashboard');
      
    } catch (error: any) {
      // Якщо бекенд повернув 400/401, виводимо помилку
      setServerError(
        error.response?.data?.error || 'Помилка авторизації. Перевірте підключення до сервера.'
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Увійти в HMS</h1>
          <p className="text-slate-500 mt-2">Введіть свої дані для доступу до панелі</p>
        </div>

        {/* Якщо є помилка від бекенду - показуємо червону плашку */}
        {serverError && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
            {serverError}
          </div>
        )}

        {/* Форма */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          {/* Поле Email */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              {...register('email')} // Реєструємо інпут в RHF
              className={`w-full rounded-lg border p-3 outline-none transition-all ${
                errors.email ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }`}
              placeholder="admin@hotel.com"
            />
            {/* Повідомлення про помилку від Zod */}
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Поле Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Пароль</label>
            <input
              type="password"
              {...register('password')} // Реєструємо інпут в RHF
              className={`w-full rounded-lg border p-3 outline-none transition-all ${
                errors.password ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }`}
              placeholder="••••••••"
            />
            {/* Повідомлення про помилку від Zod */}
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Кнопка відправки */}
          <button
            type="submit"
            disabled={isSubmitting} // Блокуємо кнопку, поки йде запит
            className="mt-4 w-full rounded-lg bg-blue-600 p-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isSubmitting ? 'Вхід...' : 'Увійти'}
          </button>

        </form>
      </div>
    </div>
  );
};