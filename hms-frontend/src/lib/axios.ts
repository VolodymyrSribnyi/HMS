import axios from 'axios';
import { useAuthStore } from '../features/auth/stores/authStore';
// Створюємо екземпляр Axios із базовим URL нашого .NET бекенду
export const apiClient = axios.create({
  baseURL: 'https://localhost:7063/api', // Заміни на порт свого бекенду!
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});
let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void; }[] = [];

const processQueue = (error: unknown ,token = null) => {
    failedQueue.forEach(prom => {
        if(error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};
// Додаємо Interceptor, який спрацьовує ПЕРЕД кожним запитом
apiClient.interceptors.request.use(
  (config) => {
    // Дістаємо токен з LocalStorage
    const token = useAuthStore.getState().accessToken;
    
    // Якщо токен є, додаємо його в заголовок Authorization
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Додаємо Response Interceptor для обробки помилок [6]
apiClient.interceptors.response.use(
  (response) => {
    return response; // Якщо запит успішний - просто повертаємо його
  },
  async (error) => {
    const originalRequest = error.config;

    // Якщо сервер повернув 401 і ми ще не намагалися повторити цей конкретний запит [5, 6]
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Якщо процес оновлення токена вже йде, ставимо запит у чергу [6]
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
        .then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return apiClient(originalRequest); // Повторюємо запит після успішного оновлення
        })
        .catch(err => {
          return Promise.reject(err);
        });
      }

      // Позначаємо, що ми почали процес оновлення, і маркуємо оригінальний запит [5, 6]
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Звертаємося до бекенду за новим Access Token [6, 8]
        // Refresh Token автоматично відправиться браузером, якщо він у HttpOnly Cookie
        const { data } = await axios.post('https://localhost:7063/api/auth/refresh', {}, { withCredentials: true });
        
        const newAccessToken = data.accessToken;
        
        // Зберігаємо новий токен (наприклад, у пам'яті програми/Redux/Zustand)
        useAuthStore.getState().setToken(newAccessToken);
        // Оновлюємо заголовок оригінального запиту [6]
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        // Викликаємо всі заблоковані паралельні запити з новим токеном [6]
        processQueue(null, newAccessToken);

        // Виконуємо оригінальний запит, який ініціював процес [5, 6]
        return apiClient(originalRequest);

      } catch (refreshError) {
        // Якщо оновлення теж повернуло помилку (наприклад, Refresh Token прострочився)
        processQueue(refreshError, null);
        
        useAuthStore.getState().clearAuth();

        return Promise.reject(refreshError);
      } finally {
        // Позначаємо, що процес оновлення завершено [6]
        isRefreshing = false;
      }
    }

    // Для всіх інших помилок просто повертаємо їх далі
    return Promise.reject(error);
  }
);