# Simme

Веб-приложение для технического сопровождения абонентов мобильной связи.

## Хранение данных

Проект переведён на `MongoDB`.

Теперь данные сохраняются:

- в базе `simme`
- в коллекции `app_state`
- в документе с `_id: "main"`

При первом запуске сервер автоматически берёт существующие данные из [data/db.json](/D:/new/data/db.json) и переносит их в MongoDB.

## Требования

- `Node.js` 18+
- установленный и запущенный `MongoDB Server`

## Настройки подключения

Пример переменных:

```env
DATABASE_URL=mongodb://127.0.0.1:27017
DATABASE_NAME=simme
PORT=3000
CORS_ORIGINS=https://your-username.github.io
```

См. [.env.example](/D:/new/.env.example).

## GitHub Pages -> локальный API

Чтобы страница на GitHub Pages обращалась к вашему локальному Node.js, нужен туннель до `localhost`.

1. Запустите сервер:

```powershell
cd D:\new
npm start
```

2. Поднимите туннель (пример с localtunnel):

```powershell
npx localtunnel --port 3000
```

3. В `.env` укажите домен GitHub Pages в `CORS_ORIGINS` и перезапустите сервер.

4. Откройте GitHub Pages с параметром `apiBase`, например:

```text
https://your-username.github.io/your-repo/?apiBase=https://your-subdomain.loca.lt
```

Фронтенд сохранит `apiBase` в `localStorage` и будет использовать его для всех запросов `/api/*`.

## Установка

```powershell
cd D:\new
npm install
```

## Запуск

Если MongoDB установлен локально и служба уже работает:

```powershell
cd D:\new
$env:DATABASE_URL="mongodb://127.0.0.1:27017"
$env:DATABASE_NAME="simme"
npm start
```

После этого откройте:

```text
http://localhost:3000
```

## Как создаётся база

MongoDB создаёт базу `simme` автоматически при первой записи.

Отдельно вручную создавать базу не нужно.

## Демо-доступ

- клиент: `client@demo.by` / `client123`
- администратор: `admin@demo.by` / `admin123`

## Важная пометка

Файл [data/db.json](/D:/new/data/db.json) теперь нужен только как источник начальной миграции. Основные рабочие данные после запуска уже должны храниться в MongoDB.
