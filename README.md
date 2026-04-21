# RoadGuardAI
Интеллектуальная система мониторинга дорожного покрытия с использованием компьютерного зрения.

## Описание
Веб-приложение для обнаружения и учёта дефектов дорожного покрытия с использованием компьютерного зрения. 
Пользователи могут сообщать о проблемах (ямы, трещины, отсутствие люков), прикреплять фото, которые автоматически анализируются нейросетью для классификации типа повреждения.

## Стек
- ML: Python, PyTorch, YOLO, OpenCV
- Backend: FastAPI, PostgreSQL, SQLAlchemy, JWT
- Frontend: React, TypeScript, React Router DOM, Material-UI, Axios, Zustand
- Общее: Docker / Docker Compose, Nginx, MinIO, GitHub Actions
- Архитектура backend: Repository-Service Pattern (уровни: api, services, repositories)

## Функционал системы
- Аутентификация и авторизация пользователей
- Создание, просмотр, редактирование и удаление проблем дорожного покрытия
- Ролевая модель: граждане, инспекторы, подрядчики, администраторы
- Автоматический анализ фото нейросетью (YOLO) с определением типа повреждения
- Загрузка и хранение фото в S3-совместимом хранилище MinIO
- Фильтрация, поиск, сортировка и пагинация списка проблем
- Подсказки адресов через Яндекс.Геокодер API
- Изменение статуса проблемы (новая / в работе / решена / закрыта)
- Личный кабинет пользователя с историей активности
- Админ-панель для управления ролями пользователей
- Контейнеризация и оркестрация через Docker Compose
- CI/CD пайплайн (GitHub Actions)

## Быстрый старт (режим разработки)
Запуск в 2 терминалах.
1) Backend (терминал 1) из папки backend:
```
pip install -r requirements.txt
python run.py
```
2) Frontend (терминал №2) из папки frontend:  
```
npm install
npm start
```
Станут доступны: веб-приложение (http://localhost:3000/), документация backend (http://localhost:8000/docs). 

## Структура проекта
```
RoadGuardAI/
├── backend/                         # FastAPI бэкенд
│   ├── app/
│   │   ├── api/                     # Роутеры (admin, auth, ml, problems)
│   │   ├── core/                    # Конфиги и безопасность (JWT, хеширование)
│   │   ├── models/                  # SQLAlchemy модели (User, Problem, RefreshToken)
│   │   ├── repositories/            # Слой работы с БД
│   │   ├── schemas/                 # Pydantic схемы валидации
│   │   ├── services/                # Бизнес-логика (auth, ml, problem)
│   │   ├── database.py              # Подключение к PostgreSQL
│   │   └── main.py                  # Точка входа FastAPI
│   ├── requirements.txt
│   └── run.py
│
├── frontend/                        # React + TypeScript фронтенд
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json            # PWA конфиг
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/              # React компоненты (Dashboard, Header, ProblemForm, ProblemList, Profile)
│   │   ├── services/
│   │   │   └── types.ts             # API клиент (Axios) и TypeScript типы
│   │   ├── store/
│   │   │   └── authStore.ts         # Zustand (аутентификация)
│   │   ├── App.tsx                  # Роутинг (React Router)
│   │   └── index.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── ml_module/                       # Обученная YOLO модель
│   └── roadguard_models/v2/weights/best.pt
│
├── nginx/
│   └── nginx.conf                   # Reverse proxy конфиг
├── docker-compose.yml               # Оркестрация 5 сервисов
└── README.md
```

