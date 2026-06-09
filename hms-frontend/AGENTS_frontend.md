# AGENTS.md — HMS Frontend (React Client)

> Фронтенд знаходиться у папці `hms-frontend/` від кореня репозиторію.
> Цей файл — джерело контексту для AI-агентів (Codex, Gemini CLI).

---

## 1. Стек

| Технологія | Версія | Призначення |
|------------|--------|-------------|
| React | 18 | UI |
| TypeScript | 5+ | Типізація |
| Vite | latest | Build tool, dev server (порт 5173) |
| React Router | v6 | Клієнтський роутинг |
| Zustand | latest | Глобальний стан (тільки auth) |
| Axios | latest | HTTP-клієнт |
| Tailwind CSS | v4 | Стилі (`@import "tailwindcss"` у index.css) |
| react-hook-form | latest | Форми (де реалізовано) |
| zod | latest | Схеми валідації форм |

**Немає:** React Query, Redux, MUI, Shadcn, інших UI-бібліотек.

---

## 2. Структура папок

```
hms-frontend/src/
├── components/
│   └── Layout/
│       └── MainLayout.tsx       ← sidebar + <Outlet /> для захищених маршрутів
├── features/
│   ├── auth/
│   │   ├── LoginPage.tsx        ← react-hook-form + zod ✅
│   │   ├── RegisterPage.tsx     ← manual useState (tech debt, потребує рефакторингу)
│   │   └── stores/
│   │       └── authStore.ts     ← Zustand store
│   ├── bookings/
│   │   ├── BookingsPage.tsx
│   │   └── bookingApi.ts
│   └── rooms/
│       ├── RoomsPage.tsx
│       └── roomsApi.ts
├── lib/
│   └── axios.ts                 ← apiClient: base URL, interceptors
├── types/
│   ├── booking.ts
│   └── rooms.ts
├── App.tsx                      ← routing + silent refresh on mount
├── main.tsx
└── index.css                    ← @import "tailwindcss"
```

### Де що розміщувати

- **Нова сторінка** → `src/features/{feature}/{Feature}Page.tsx`
- **API-функції фічі** → `src/features/{feature}/{feature}Api.ts`
- **Типи DTO** → `src/types/{feature}.ts`
- **Shared компоненти** → `src/components/{ComponentName}.tsx`
- **Новий Zustand store** → `src/features/{feature}/stores/{feature}Store.ts`

---

## 3. Auth потік

### 3.1 Ініціалізація (App.tsx)

При кожному завантаженні застосунку `App.tsx` виконує `POST /api/auth/refresh`.
Refresh Token надсилається автоматично браузером (HttpOnly cookie, `withCredentials: true`).

```typescript
// App.tsx — спрощено
useEffect(() => {
  const attemptSilentRefresh = async () => {
    try {
      const { data } = await apiClient.post('/auth/refresh');
      setToken(data.accessToken);      // зберігаємо в Zustand
    } catch {
      clearAuth();                      // не авторизований
    } finally {
      setIsInitializing(false);         // прибираємо splash screen
    }
  };
  attemptSilentRefresh();
}, []);
```

`isInitializing = true` → показує splash screen, запобігає redirect loop.

### 3.2 Zustand authStore

```typescript
// src/features/auth/stores/authStore.ts
interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  clearAuth: () => void;
}
```

> ⚠️ **TODO:** Додати `roles: string[]` та `userId: string` у стейт.
> Декодувати з JWT payload після setToken (`import { jwtDecode } from 'jwt-decode'`).

### 3.3 Access Token — тільки в пам'яті

Access Token живе **виключно в Zustand** (в пам'яті).
При перезавантаженні сторінки — токен втрачається, але відновлюється через silent refresh.

```typescript
// ❌ НЕ РОБИТИ
localStorage.setItem('token', accessToken);

// ✅ ПРАВИЛЬНО
useAuthStore.getState().setToken(accessToken);
```

### 3.4 Axios interceptors (src/lib/axios.ts)

**Request interceptor** — автоматично додає `Authorization: Bearer {token}` з Zustand.

**Response interceptor** — при 401:
1. Якщо `isRefreshing === false` → запускає refresh, `isRefreshing = true`
2. Якщо `isRefreshing === true` → ставить запит у `failedQueue`
3. Після успішного refresh → викликає `processQueue(null, newToken)`, повторює оригінальний запит
4. При помилці refresh → `processQueue(error)`, `clearAuth()`

---

## 4. API-клієнт

### 4.1 Базова конфігурація

```typescript
// src/lib/axios.ts
export const apiClient = axios.create({
  baseURL: 'https://localhost:7063/api',  // TODO: перенести у VITE_API_URL
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,  // КРИТИЧНО для HttpOnly cookie
});
```

> ⚠️ **TODO:** Замінити хардкодований URL на `import.meta.env.VITE_API_URL`.
> Створити `.env.local` з `VITE_API_URL=https://localhost:7063/api`.

### 4.2 Конвенція для API-модулів

Кожна фіча має свій `*Api.ts` файл. Функції — `async`, типізовані, не обробляють помилки самостійно.

```typescript
// src/features/bookings/bookingApi.ts
import { apiClient } from '../../lib/axios';
import type { BookingDto } from '../../types/booking';

export const getMyBookings = async (): Promise<BookingDto[]> => {
  const response = await apiClient.get('/booking/my-bookings');
  return response.data.value;  // бекенд повертає { value: [...] } для Result<T>
};

export const createBooking = async (payload: CreateBookingPayload): Promise<string> => {
  const response = await apiClient.post('/booking', payload);
  return response.data.bookingId;
};
```

> ⚠️ Зверни увагу: бекенд повертає `Result<T>`, тому для деяких endpoints
> дані знаходяться в `response.data.value`, а не в `response.data` напряму.
> Перевіряй у Swagger або коді контролера що саме повертається.

### 4.3 Обробка помилок

Помилки обробляються у компоненті-споживачу, не в `*Api.ts`:

```typescript
// У компоненті
try {
  const data = await getMyBookings();
  setBookings(data);
} catch (error: unknown) {
  const message = getApiError(error) ?? 'Не вдалося завантажити дані';
  setError(message);
}

// Утиліта (є в RoomsPage.tsx, можна винести у src/lib/getApiError.ts)
const getApiError = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as { response?: { data?: { error?: string } } }).response?.data?.error;
  }
  return undefined;
};
```

---

## 5. Routing

Весь роутинг — у `App.tsx`. Структура:

```
/ redirect → /dashboard (якщо авторизований) або /login
/login    ← LoginPage (публічний)
/register ← RegisterPage (публічний)
/dashboard   ← DashboardPage (захищений, у MainLayout)
/bookings    ← BookingsPage (захищений)
/rooms       ← RoomsPage (захищений)
/* → /dashboard або /login (залежно від isAuthenticated)
```

**MainLayout** (`src/components/Layout/MainLayout.tsx`):
- Sidebar із навігаційними посиланнями
- `<Outlet />` для підстановки сторінок
- Кнопка "Вийти" → `clearAuth()`

### Додавання нового маршруту

1. Створи `src/features/{feature}/{Feature}Page.tsx`
2. Додай `import` у `App.tsx`
3. Додай `<Route path="/{feature}" element={<FeaturePage />} />` всередині `<Route element={<MainLayout />}>`
4. Додай посилання у `MainLayout.tsx`

---

## 6. Форми

### 6.1 Патерн (react-hook-form + zod) — СТАНДАРТ

Використовуй цей патерн для всіх нових форм. Дивись `LoginPage.tsx` як зразок.

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  email: z.string().email('Невірний формат email'),
  password: z.string().min(8, 'Мінімум 8 символів'),
});

type FormInputs = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormInputs>({
  resolver: zodResolver(schema),
});

const onSubmit = async (data: FormInputs) => {
  // викликається тільки якщо валідація пройшла
};
```

### 6.2 Tech debt

`RegisterPage.tsx` використовує manual `useState` для полів форми — це tech debt.
Якщо вносиш зміни в RegisterPage — одночасно рефактори на RHF + zod.

---

## 7. Типізація

### 7.1 Типи у src/types/

```typescript
// types/booking.ts
export interface BookingDto {
  id: string;        // Guid як string
  roomTypeName: string;
  checkInDate: string;   // ISO datetime string
  checkOutDate: string;
  totalPrice: number;
  status: string;        // TODO: замінити на BookingStatus union type
  assignedRoomId: string | null;
}
```

### 7.2 Конвенції

- `interface` — для API response shapes (DTO)
- `type` — для union types та aliases (`type RoomStatus = 'Available' | ...`)
- `Guid` з бекенду завжди приходить як `string` у TypeScript
- Дати приходять як ISO string, рендер через `new Date(str).toLocaleDateString('uk-UA')`
- `any` — **заборонено**. Використовуй `unknown` + type guards

---

## 8. Стилізація (Tailwind CSS v4)

```css
/* index.css */
@import "tailwindcss";
```

Використовуй тільки utility-класи Tailwind. Кастомні CSS правила — тільки в `App.css` для специфічних layout потреб.

**Колірна схема (поточна):**
- Фон: `bg-slate-50` (загальний), `bg-white` (картки, панелі)
- Основний акцент: `blue-600` (кнопки, активні посилання)
- Сайдбар: `bg-white shadow-lg`
- Помилки: `bg-red-50 border-red-200 text-red-600`
- Успіх: `bg-green-50 border-green-200 text-green-700`

---

## 9. Поточний стан та TODO

### ✅ Реалізовано

- Auth flow (login, register, silent refresh, logout)
- JWT + HttpOnly cookie Refresh Token
- Axios з автоматичним refresh при 401
- Перегляд власних бронювань (`/bookings`)
- CRUD для Room та RoomType (`/rooms`)
- MainLayout із sidebar
- Захищені маршрути

### 🔲 TODO

#### Критичні

- [ ] `VITE_API_URL` у `.env.local` (прибрати хардкод URL)
- [ ] `roles: string[]` у `authStore` (декодувати з JWT)
- [ ] Рефакторинг `RegisterPage` → RHF + zod
- [ ] 403 handling в axios response interceptor

#### Нові фічі (синхронізувати з бекендом TODO)

- [ ] **Check-in/Check-out** → сторінка для Receptionist
  - `POST /api/booking/{id}/checkin`
  - `POST /api/booking/{id}/checkout`
- [ ] **Invoice** → перегляд рахунку при checkout
  - `GET /api/invoice/by-booking/{bookingId}`
- [ ] **Payment** → форма реєстрації оплати
  - `POST /api/payment`
- [ ] **CleaningTask** → список задач для Maid
  - `GET /api/cleaningtask/pending`
  - `PUT /api/cleaningtask/{id}/complete`
- [ ] **Роль-базована навігація** — показувати sidebar items відповідно до ролі
- [ ] **Dashboard** → реальний вміст замість placeholder

---

## 10. Заборонені патерни

```typescript
// ❌ НЕ РОБИТИ: токен у localStorage
localStorage.setItem('accessToken', token);

// ❌ НЕ РОБИТИ: прямий axios замість apiClient
import axios from 'axios';
axios.post('https://localhost:7063/api/...');
// Виняток: RegisterPage ще так робить — це tech debt

// ❌ НЕ РОБИТИ: тип any
const data: any = response.data;

// ❌ НЕ РОБИТИ: inline стилі замість Tailwind
<div style={{ backgroundColor: 'red' }}>

// ❌ НЕ РОБИТИ: Zustand для server data
// Zustand — тільки для client state (auth). Дані з API — у useState компонента

// ❌ НЕ РОБИТИ: обробка помилок у *Api.ts файлах
// Функції в *Api.ts просто кидають помилку, ловиш у компоненті
```

---

## 11. Команди розробника

```bash
cd hms-frontend

npm install       # встановити залежності
npm run dev       # запустити dev server (http://localhost:5173)
npm run build     # production build
npm run lint      # ESLint перевірка
```

**API URL:** `https://localhost:7063/api` (бекенд повинен бути запущений)
