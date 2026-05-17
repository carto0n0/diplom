const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { MongoClient } = require("mongodb");

const PORT = process.env.PORT || 5000;
const LEGACY_DB_PATH = path.join(__dirname, "data", "db.json");
const PUBLIC_DIR = path.join(__dirname, "public");
const DATABASE_URL = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017";
const DATABASE_NAME = process.env.DATABASE_NAME || "simme";
const COLLECTION_NAME = "app_state";
const APP_STATE_KEY = "main";
const ALLOWED_CORS_ORIGINS = String(process.env.CORS_ORIGINS || "https://carto0n0.github.io,http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const mongoClient = new MongoClient(DATABASE_URL);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const DEFAULT_TARIFFS = [
  {
    id: "smart-mini",
    category: "Для смартфона",
    name: "Smart Mini",
    monthlyPrice: 14.9,
    minutes: 200,
    internetGb: 10,
    sms: 50,
    servicesIncluded: ["antispam", "social-mini"],
    description: "Компактный тариф для повседневного общения.",
    details: "Подходит для переписки, звонков и соцсетей. Небольшая абонентская плата и базовый набор сервисов."
  },
  {
    id: "smart-max",
    category: "Для смартфона",
    name: "Smart Max",
    monthlyPrice: 29.9,
    minutes: 900,
    internetGb: 50,
    sms: 300,
    servicesIncluded: ["antispam", "mobile-tv", "safe-device"],
    description: "Расширенный тариф для активного использования смартфона.",
    details: "Большой пакет интернета, звонков и дополнительные цифровые сервисы."
  },
  {
    id: "internet-home",
    category: "Для интернета",
    name: "Internet Home",
    monthlyPrice: 24.5,
    minutes: 50,
    internetGb: 120,
    sms: 30,
    servicesIncluded: ["night-unlim", "router-mode"],
    description: "Тариф для тех, кому нужен в первую очередь интернет.",
    details: "Подходит для модема, планшета, ноутбука и домашнего роутера."
  },
  {
    id: "kids-safe",
    category: "Детям",
    name: "Kids Safe",
    monthlyPrice: 12.9,
    minutes: 250,
    internetGb: 8,
    sms: 100,
    servicesIncluded: ["parent-control", "safe-device", "antispam"],
    description: "Безопасный тариф для детей с контролем и защитой.",
    details: "Включает родительский контроль, ограничение нежелательного контента и защитные функции."
  },
  {
    id: "silver-care",
    category: "На пенсии",
    name: "Silver Care",
    monthlyPrice: 9.9,
    minutes: 600,
    internetGb: 5,
    sms: 150,
    servicesIncluded: ["call-priority", "antispam"],
    description: "Льготный тариф с акцентом на звонки и простоту.",
    details: "Минимальная абонентская плата, увеличенный пакет минут и простые условия обслуживания."
  },
  {
    id: "talk-master",
    category: "Разговоры",
    name: "Talk Master",
    monthlyPrice: 19.9,
    minutes: 2000,
    internetGb: 6,
    sms: 200,
    servicesIncluded: ["extra-voicemail", "call-priority"],
    description: "Тариф для тех, кто чаще звонит, чем использует интернет.",
    details: "Большой пакет минут, удобен для бизнеса и постоянного голосового общения."
  },
  {
    id: "travel-flex",
    category: "Путешественник",
    name: "Travel Flex",
    monthlyPrice: 34.9,
    minutes: 700,
    internetGb: 35,
    sms: 250,
    servicesIncluded: ["roaming-lite", "roaming-plus", "travel-insurance"],
    description: "Тариф для поездок по Беларуси, СНГ и Европе.",
    details: "Включает выгодные роуминговые пакеты и дополнительные опции для путешествий."
  }
];

const DEFAULT_SERVICES = [
  {
    id: "sms-100",
    category: "SMS",
    name: "Пакет 100 SMS",
    type: "SMS",
    price: 2.5,
    description: "Дополнительный пакет коротких сообщений.",
    details: "Подходит для клиентов, которые активно используют SMS в течение месяца."
  },
  {
    id: "sms-500",
    category: "SMS",
    name: "Пакет 500 SMS",
    type: "SMS",
    price: 6.5,
    description: "Расширенный пакет сообщений.",
    details: "Выгодный вариант для активной переписки по SMS."
  },
  {
    id: "minutes-200",
    category: "Минуты",
    name: "Дополнительные 200 минут",
    type: "Минуты",
    price: 5.5,
    description: "Пакет исходящих минут на все сети Беларуси.",
    details: "Подключается на месяц и расходуется после основного тарифа."
  },
  {
    id: "minutes-1000",
    category: "Минуты",
    name: "Дополнительные 1000 минут",
    type: "Минуты",
    price: 12.9,
    description: "Большой пакет минут для частых звонков.",
    details: "Рекомендуется для разговорных тарифов и делового общения."
  },
  {
    id: "internet-10",
    category: "Интернет",
    name: "Интернет +10 ГБ",
    type: "Интернет",
    price: 7.9,
    description: "Быстрый интернет для видео, работы и навигации.",
    details: "Добавляет трафик на текущий расчётный период."
  },
  {
    id: "internet-50",
    category: "Интернет",
    name: "Интернет +50 ГБ",
    type: "Интернет",
    price: 16.9,
    description: "Крупный пакет для активного интернет-потребления.",
    details: "Подходит для стриминга, ноутбука и раздачи интернета."
  },
  {
    id: "roaming-lite",
    category: "Роуминг",
    name: "Роуминг Lite",
    type: "Роуминг",
    price: 9.5,
    description: "Базовый роуминг для поездок.",
    details: "Включает пакет минут и интернета в странах СНГ."
  },
  {
    id: "roaming-plus",
    category: "Роуминг",
    name: "Роуминг Plus",
    type: "Роуминг",
    price: 17.5,
    description: "Расширенный роуминг для Европы и дальних поездок.",
    details: "Дополнительный трафик и минуты для международных направлений."
  },
  {
    id: "safe-device",
    category: "Антивирус",
    name: "Мобильный антивирус",
    type: "Антивирус",
    price: 4.9,
    description: "Защита устройства от угроз и вредоносных ссылок.",
    details: "Сканирование приложений, защита браузера и уведомления об угрозах."
  },
  {
    id: "antispam",
    category: "Антиреклама",
    name: "Антиспам и антиреклама",
    type: "Антиреклама",
    price: 2.9,
    description: "Фильтрация рекламных и подозрительных SMS/звонков.",
    details: "Снижает количество нежелательных уведомлений и спам-звонков."
  },
  {
    id: "parent-control",
    category: "Безопасность",
    name: "Родительский контроль",
    type: "Безопасность",
    price: 3.5,
    description: "Контроль детского номера и доступных сервисов.",
    details: "Позволяет ограничивать контент и контролировать основные действия."
  },
  {
    id: "night-unlim",
    category: "Интернет",
    name: "Ночной безлимит",
    type: "Интернет",
    price: 5.9,
    description: "Безлимитный интернет ночью.",
    details: "Подходит для скачивания крупных файлов и обновлений."
  }
  ,
  {
    id: "sms-1000",
    category: "SMS",
    name: "Пакет 1000 SMS",
    type: "SMS",
    amount: 1000,
    price: 9.9,
    description: "Максимальный пакет сообщений для активного общения.",
    details: "Подходит для активной переписки и уведомлений в течение всего месяца."
  },
  {
    id: "minutes-50",
    category: "Минуты",
    name: "Дополнительные 50 минут",
    type: "Минуты",
    amount: 50,
    price: 1.9,
    description: "Небольшой пакет минут для оперативных звонков.",
    details: "Хорошо дополняет базовые тарифы с небольшим пакетом минут."
  },
  {
    id: "roaming-day",
    category: "Роуминг",
    name: "Роуминг на 1 день",
    type: "Роуминг",
    price: 4.9,
    description: "Короткий пакет для однодневных поездок.",
    details: "Позволяет выйти на связь в день прибытия без подключения полного пакета."
  },
  {
    id: "safe-device-plus",
    category: "Антивирус",
    name: "Антивирус Plus",
    type: "Антивирус",
    price: 6.9,
    description: "Расширенная защита смартфона и ссылок.",
    details: "Включает антифишинг, проверку приложений и контроль вредоносной активности."
  },
  {
    id: "safe-device-kids",
    category: "Антивирус",
    name: "Детский антивирус",
    type: "Антивирус",
    price: 3.9,
    description: "Легкая защита для детских устройств.",
    details: "Подходит для смартфонов детей и блокирует опасные сайты и подозрительные загрузки."
  },
  {
    id: "antispam-plus",
    category: "Антиреклама",
    name: "Антиреклама Plus",
    type: "Антиреклама",
    price: 4.4,
    description: "Усиленная фильтрация нежелательных звонков и SMS.",
    details: "Снижает количество рекламных кампаний, подозрительных вызовов и массовых рассылок."
  },
  {
    id: "calls-blocker",
    category: "Антиреклама",
    name: "Блокировка нежелательных вызовов",
    type: "Антиреклама",
    price: 3.4,
    description: "Автоматически отсеивает часть спам-звонков.",
    details: "Работает в фоновом режиме и помогает уменьшить число мошеннических звонков."
  },
  {
    id: "geo-protect",
    category: "Безопасность",
    name: "Геозащита",
    type: "Безопасность",
    price: 2.9,
    description: "Уведомления о перемещении устройства.",
    details: "Подходит для семейных номеров и помогает контролировать важные зоны пребывания."
  },
  {
    id: "safe-pay",
    category: "Безопасность",
    name: "Защита платежей",
    type: "Безопасность",
    price: 4.1,
    description: "Предупреждение о подозрительных переходах и оплатах.",
    details: "Снижает риск мошеннических схем при использовании мобильных платежей."
  }
];

const DEFAULT_PROMOTIONS = [
  {
    id: "promo-spring",
    title: "Весенний бонус",
    description: "Пополните баланс от 30 BYN и получите бонус.",
    details: "При пополнении баланса на сумму от 30 BYN в течение акции клиент получает 5 бонусных BYN на лицевой счёт."
  },
  {
    id: "promo-esim",
    title: "Быстрый переход на eSIM",
    description: "Получите номер онлайн и активируйте eSIM за несколько минут.",
    details: "Новый клиент может зарегистрироваться онлайн, получить номер и использовать eSIM до посещения отделения."
  },
  {
    id: "promo-family",
    title: "Семейная группа",
    description: "Подключите второй номер и получите скидку на услуги.",
    details: "При подключении двух и более номеров в одном аккаунте действует скидка на выбранные сервисы."
  }
];

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return {
    salt,
    hash: crypto.scryptSync(password, salt, 64).toString("hex")
  };
}

function createToken() {
  return crypto.randomBytes(24).toString("hex");
}

function createDefaultDb() {
  const now = new Date().toISOString();
  const clientPassword = hashPassword("client123");
  const adminPassword = hashPassword("admin123");
  return {
    meta: {
      createdAt: now,
      lastUserId: 2,
      lastOperationId: 3,
      lastTicketId: 1,
      lastNotificationId: 2,
      lastMailingId: 1
    },
    tariffs: DEFAULT_TARIFFS,
    services: DEFAULT_SERVICES,
    promotions: DEFAULT_PROMOTIONS,
    users: [
      {
        id: 1,
        role: "client",
        fullName: "Анна Ковальчук",
        email: "client@demo.by",
        passwordHash: clientPassword.hash,
        passwordSalt: clientPassword.salt,
        passportId: "MP1234567",
        birthDate: "1999-08-14",
        address: "Минск, ул. Сурганова, 21",
        preferredTheme: "light",
        rememberPassword: true,
        tariffId: "smart-max",
        connectedServiceIds: ["internet-10", "safe-device", "antispam"],
        balance: -4.3,
        bonusPoints: 125,
        simType: "eSIM",
        simStatus: "Ожидает выдачи физической SIM",
        numbers: ["+375291112233", "+375447778899"],
        notifications: [
          {
            id: 1,
            title: "Добро пожаловать",
            text: "Ваш номер успешно зарегистрирован. Физическую SIM можно получить в отделении.",
            createdAt: now
          }
        ],
        operationHistory: [
          {
            id: 1,
            date: now,
            type: "Пополнение картой",
            amount: 25,
            status: "Выполнено",
            description: "Баланс пополнен банковской картой"
          },
          {
            id: 2,
            date: now,
            type: "Списание",
            amount: -29.3,
            status: "Выполнено",
            description: "Абонентская плата и платные услуги"
          }
        ],
        createdAt: now
      },
      {
        id: 2,
        role: "admin",
        fullName: "Администратор системы",
        email: "admin@demo.by",
        passwordHash: adminPassword.hash,
        passwordSalt: adminPassword.salt,
        preferredTheme: "dark",
        rememberPassword: false,
        createdAt: now
      }
    ],
    tickets: [
      {
        id: 1,
        clientId: 1,
        topic: "Активация eSIM",
        message: "Нужно уточнить, когда можно получить физическую SIM в отделении.",
        status: "Открыт",
        createdAt: now
      }
    ],
    mailingHistory: [
      {
        id: 1,
        title: "Новая акция",
        message: "Подключите интернет-пакет со скидкой 20% до конца месяца.",
        sentAt: now,
        recipientsCount: 1,
        filter: { mode: "all" }
      }
    ]
  };
}

function normalizeDb(db) {
  db.meta = db.meta || {};
  db.meta.lastUserId = db.meta.lastUserId || (db.users?.length || 0);
  db.meta.lastOperationId = db.meta.lastOperationId || 1;
  db.meta.lastTicketId = db.meta.lastTicketId || 1;
  db.meta.lastNotificationId = db.meta.lastNotificationId || 1;
  db.meta.lastMailingId = db.meta.lastMailingId || (db.mailingHistory?.length || 0);
  db.tariffs = Array.isArray(db.tariffs) ? db.tariffs : [];
  db.services = Array.isArray(db.services) ? db.services : [];
  db.promotions = Array.isArray(db.promotions) ? db.promotions : [];
  db.users = Array.isArray(db.users) ? db.users : [];
  db.tickets = Array.isArray(db.tickets) ? db.tickets : [];
  db.mailingHistory = Array.isArray(db.mailingHistory) ? db.mailingHistory : [];

  for (const tariff of DEFAULT_TARIFFS) {
    if (!db.tariffs.some((item) => item.id === tariff.id)) db.tariffs.push(tariff);
  }
  for (const service of DEFAULT_SERVICES) {
    if (!db.services.some((item) => item.id === service.id)) db.services.push(service);
  }
  for (const promo of DEFAULT_PROMOTIONS) {
    if (!db.promotions.some((item) => item.id === promo.id)) db.promotions.push(promo);
  }

  db.users.forEach((user) => {
    user.notifications = Array.isArray(user.notifications) ? user.notifications : [];
    user.operationHistory = Array.isArray(user.operationHistory) ? user.operationHistory : [];
    user.connectedServiceIds = Array.isArray(user.connectedServiceIds) ? user.connectedServiceIds : [];
    user.numbers = Array.isArray(user.numbers) ? user.numbers : [];
    user.preferredTheme = user.preferredTheme || "light";
  });

  return db;
}

function readLegacyDbFile() {
  if (!fs.existsSync(LEGACY_DB_PATH)) return null;
  return normalizeDb(JSON.parse(fs.readFileSync(LEGACY_DB_PATH, "utf8")));
}

function getStateCollection() {
  return mongoClient.db(DATABASE_NAME).collection(COLLECTION_NAME);
}

async function ensureDatabase() {
  await mongoClient.connect();
  const collection = getStateCollection();
  const existing = await collection.findOne({ _id: APP_STATE_KEY });
  if (existing) return;
  const initialState = readLegacyDbFile() || createDefaultDb();
  await collection.updateOne(
    { _id: APP_STATE_KEY },
    {
      $setOnInsert: {
        state: normalizeDb(initialState),
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
}

async function readDb() {
  await ensureDatabase();
  const collection = getStateCollection();
  const document = await collection.findOne({ _id: APP_STATE_KEY });
  if (!document) {
    const fallback = normalizeDb(createDefaultDb());
    await writeDb(fallback);
    return fallback;
  }
  return normalizeDb(document.state);
}

async function writeDb(db) {
  await ensureDatabase();
  const collection = getStateCollection();
  await collection.updateOne(
    { _id: APP_STATE_KEY },
    {
      $set: {
        state: normalizeDb(db),
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function applyCors(req, res) {
  const requestOrigin = String(req.headers.origin || "").trim();
  const allowAll = ALLOWED_CORS_ORIGINS.includes("*");
  if (allowAll) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (requestOrigin && ALLOWED_CORS_ORIGINS.includes(requestOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) reject(new Error("Payload too large"));
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function matches(value, pattern) {
  return pattern.test(String(value || "").trim());
}

function optional(value, pattern) {
  if (!String(value || "").trim()) return true;
  return pattern.test(String(value || "").trim());
}

const patterns = {
  fullName: /^[\p{L}' -]{2,80}$/u,
  email: /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/,
  password: /^[^\r\n]{6,24}$/,
  passportId: /^[A-Z]{2}\d{7}$/,
  birthDate: /^\d{4}-\d{2}-\d{2}$/,
  address: /^[\p{L}0-9\s.,\-\/\u2116]{5,120}$/u,
  title: /^[^<>]{3,120}$/,
  message: /^[^<>]{5,300}$/,
  cardNumber: /^\d{16}$/,
  cardHolder: /^[A-Z ]{4,40}$/,
  expiry: /^(0[1-9]|1[0-2])\/\d{2}$/,
  cvv: /^\d{3,4}$/,
  amount: /^\d+(\.\d{1,2})?$/,
  balance: /^-?\d+(\.\d{1,2})?$/
};

function validateClientIdentity({ fullName, email, password, passportId, birthDate, address }) {
  if (!matches(fullName, patterns.fullName)) return "ФИО содержит недопустимые символы.";
  if (!matches(email, patterns.email)) return "Введите корректный email.";
  if (typeof password !== "undefined" && String(password).trim() && !matches(password, patterns.password)) {
    return "Пароль содержит недопустимые символы.";
  }
  if (!optional(passportId, patterns.passportId)) return "Паспорт содержит недопустимые символы.";
  if (!optional(birthDate, patterns.birthDate)) return "Дата рождения указана некорректно.";
  if (!optional(address, patterns.address)) return "Адрес содержит недопустимые символы.";
  return null;
}

function validateClientIdentityStrict({ fullName, email, password, passportId, birthDate, address }) {
  if (!/^[\p{L}' -]{2,80}$/u.test(String(fullName || "").trim())) return "ФИО содержит недопустимые символы.";
  if (!matches(email, patterns.email)) return "Введите корректный email.";
  if (typeof password !== "undefined" && String(password).trim() && !/^[^\r\n]{6,24}$/.test(String(password))) {
    return "Пароль должен содержать от 6 до 24 символов.";
  }
  if (String(passportId || "").trim() && !/^[A-Z]{2}\d{7}$/.test(String(passportId).trim().toUpperCase())) {
    return "Паспорт должен быть в формате MP1234567.";
  }
  if (String(birthDate || "").trim()) {
    const parsedBirthDate = new Date(`${String(birthDate).trim()}T00:00:00`);
    if (Number.isNaN(parsedBirthDate.getTime())) return "Дата рождения указана некорректно.";
    const today = new Date();
    const minBirthDate = new Date(today.getFullYear() - 99, today.getMonth(), today.getDate());
    const maxBirthDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    if (parsedBirthDate < minBirthDate || parsedBirthDate > maxBirthDate) {
      return "Дата рождения должна подтверждать возраст от 18 до 99 лет.";
    }
  }
  if (String(address || "").trim() && !/^[\p{L}0-9\s.,\-\/\u2116]{5,120}$/u.test(String(address).trim())) {
    return "Адрес содержит недопустимые символы.";
  }
  return null;
}

function getAllActiveNumbers(db) {
  return db.users.flatMap((user) => Array.isArray(user.numbers) ? user.numbers : []);
}

function isBelarusMobileNumber(number) {
  return /^\+375(25|29|33|44)\d{7}$/.test(String(number || "").trim());
}

function calculateNumberSurcharge(number) {
  const digits = String(number || "").replace(/\D/g, "").slice(-7);
  const counts = {};
  for (const digit of digits) counts[digit] = (counts[digit] || 0) + 1;
  const maxRepeat = Math.max(0, ...Object.values(counts));
  return maxRepeat < 4 ? 10 : 10 + Math.max(0, maxRepeat - 4) * 2;
}

function createNumberOption(number) {
  return { number, surcharge: calculateNumberSurcharge(number) };
}

function getCompatibleServiceIds(tariff, services) {
  return services.filter((service) => {
    const type = String(service.type || "");
    if (type === "Интернет" && Number(tariff.internetGb || 0) >= 80) return false;
    if (type === "Минуты" && Number(tariff.minutes || 0) > 500 && Number(service.amount || 0) <= 300) return false;
    if (type === "SMS" && Number(tariff.sms || 0) >= 300) return false;
    if (type === "Роуминг" && String(tariff.category || "").includes("Путешественник")) return false;
    return true;
  }).map((service) => service.id);
}

function getSession(req, db) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  return db.users.find((user) => user.sessionToken === token) || null;
}

function getTariff(db, tariffId) {
  return db.tariffs.find((item) => item.id === tariffId) || null;
}

function getServiceList(db, ids) {
  return db.services.filter((item) => ids.includes(item.id));
}

function sanitizeUser(user, db) {
  return {
    id: user.id,
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    passportId: user.passportId || "",
    birthDate: user.birthDate || "",
    address: user.address || "",
    preferredTheme: user.preferredTheme || "light",
    rememberPassword: Boolean(user.rememberPassword),
    tariff: getTariff(db, user.tariffId),
    connectedServices: getServiceList(db, user.connectedServiceIds || []),
    compatibleServiceIds: getCompatibleServiceIds(getTariff(db, user.tariffId) || {}, db.services),
    balance: Number(user.balance || 0),
    bonusPoints: Number(user.bonusPoints || 0),
    simType: user.simType || "SIM",
    simStatus: user.simStatus || "",
    numbers: user.numbers || [],
    notifications: user.notifications || [],
    operationHistory: user.operationHistory || [],
    createdAt: user.createdAt || ""
  };
}

function publicClientProfile(user, db) {
  const safe = sanitizeUser(user, db);
  return {
    ...safe,
    ticketCount: db.tickets.filter((ticket) => ticket.clientId === user.id).length
  };
}

function randomBelarusNumber(existing) {
  const prefixes = ["25", "29", "33", "44"];
  let number = "";
  do {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = String(Math.floor(1000000 + Math.random() * 9000000));
    number = `+375${prefix}${suffix}`;
  } while (existing.includes(number));
  return number;
}

function serveStatic(req, res) {
  let filePath = req.url === "/" ? path.join(PUBLIC_DIR, "index.html") : path.join(PUBLIC_DIR, req.url);
  filePath = path.normalize(filePath);
  if (!filePath.startsWith(PUBLIC_DIR)) return sendText(res, 403, "Forbidden");
  fs.readFile(filePath, (error, content) => {
    if (error) {
      fs.readFile(path.join(PUBLIC_DIR, "index.html"), (fallbackError, fallback) => {
        if (fallbackError) return sendText(res, 404, "Not Found");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(fallback);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(content);
  });
}

function pushOperation(db, user, type, amount, description, status = "Выполнено") {
  db.meta.lastOperationId += 1;
  user.operationHistory.unshift({
    id: db.meta.lastOperationId,
    date: new Date().toISOString(),
    type,
    amount,
    status,
    description
  });
}

function pushNotification(db, user, title, text) {
  db.meta.lastNotificationId += 1;
  user.notifications.unshift({
    id: db.meta.lastNotificationId,
    title,
    text,
    createdAt: new Date().toISOString()
  });
}

function filterClientsByMailing(db, filter) {
  const clients = db.users.filter((item) => item.role === "client");
  if (!filter || !filter.mode || filter.mode === "all") return clients;
  if (filter.mode === "negative-balance") return clients.filter((client) => Number(client.balance || 0) < 0);
  if (filter.mode === "multi-number") return clients.filter((client) => (client.numbers || []).length > 1);
  if (filter.mode === "tariff") return clients.filter((client) => client.tariffId === filter.tariffId);
  return clients;
}

async function handleApi(req, res) {
  const db = await readDb();
  const sessionUser = getSession(req, db);

  if (req.method === "POST" && req.url === "/api/register") {
    const body = await parseBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const fullName = String(body.fullName || "").trim();
    if (!email || !password || !fullName) return sendJson(res, 400, { error: "Заполните имя, email и пароль." });
    const identityError = validateClientIdentityStrict({
      fullName,
      email,
      password,
      passportId: body.passportId,
      birthDate: body.birthDate,
      address: body.address
    });
    if (identityError) return sendJson(res, 400, { error: identityError });
    if (db.users.some((user) => user.email.toLowerCase() === email)) return sendJson(res, 409, { error: "Пользователь с таким email уже существует." });

    db.meta.lastUserId += 1;
    const allNumbers = db.users.flatMap((user) => user.numbers || []);
    const newNumber = randomBelarusNumber(allNumbers);
    const passwordData = hashPassword(password);
    const newUser = {
      id: db.meta.lastUserId,
      role: "client",
      fullName,
      email,
      passwordHash: passwordData.hash,
      passwordSalt: passwordData.salt,
      passportId: String(body.passportId || "").trim().toUpperCase(),
      birthDate: String(body.birthDate || "").trim(),
      address: String(body.address || "").trim(),
      preferredTheme: "light",
      rememberPassword: false,
      tariffId: DEFAULT_TARIFFS[0].id,
      connectedServiceIds: ["antispam"],
      balance: 0,
      bonusPoints: 50,
      simType: "eSIM",
      simStatus: "eSIM активирована, физическая SIM ожидает выдачи",
      numbers: [newNumber],
      notifications: [],
      operationHistory: [],
      createdAt: new Date().toISOString()
    };
    pushNotification(db, newUser, "Регистрация завершена", `Ваш новый номер ${newNumber} успешно создан и готов для eSIM.`);
    db.users.push(newUser);
    await writeDb(db);
    return sendJson(res, 201, { message: "Регистрация выполнена успешно.", generatedNumber: newNumber });
  }

  if (req.method === "POST" && req.url === "/api/login") {
    const body = await parseBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!matches(email, patterns.email) || !/^[^\r\n]{6,24}$/.test(password)) {
      return sendJson(res, 400, { error: "Некорректный формат email или пароля." });
    }
    const rememberPassword = Boolean(body.rememberPassword);
    const user = db.users.find((item) => item.email.toLowerCase() === email);
    if (!user) return sendJson(res, 401, { error: "Неверный email или пароль." });
    const check = hashPassword(password, user.passwordSalt);
    if (check.hash !== user.passwordHash) return sendJson(res, 401, { error: "Неверный email или пароль." });
    user.sessionToken = createToken();
    user.rememberPassword = rememberPassword;
    await writeDb(db);
    return sendJson(res, 200, {
      token: user.sessionToken,
      user: sanitizeUser(user, db),
      meta: {
        tariffs: db.tariffs,
        services: db.services,
        promotions: db.promotions,
        tickets: user.role === "admin" ? db.tickets : db.tickets.filter((ticket) => ticket.clientId === user.id),
        mailingHistory: user.role === "admin" ? db.mailingHistory : [],
        clients: user.role === "admin" ? db.users.filter((item) => item.role === "client").map((item) => publicClientProfile(item, db)) : []
      }
    });
  }

  if (req.method === "POST" && req.url === "/api/logout") {
    if (sessionUser) delete sessionUser.sessionToken;
    await writeDb(db);
    return sendJson(res, 200, { success: true });
  }

  if (!sessionUser) return sendJson(res, 401, { error: "Необходима авторизация." });

  if (req.method === "GET" && req.url === "/api/me") {
    return sendJson(res, 200, {
      user: sanitizeUser(sessionUser, db),
      meta: {
        tariffs: db.tariffs,
        services: db.services,
        promotions: db.promotions,
        tickets: sessionUser.role === "admin" ? db.tickets : db.tickets.filter((ticket) => ticket.clientId === sessionUser.id),
        mailingHistory: sessionUser.role === "admin" ? db.mailingHistory : [],
        clients: sessionUser.role === "admin" ? db.users.filter((item) => item.role === "client").map((item) => publicClientProfile(item, db)) : []
      }
    });
  }

  if (sessionUser.role === "client") {
    if (req.method === "POST" && req.url === "/api/client/topup") {
      const body = await parseBody(req);
      const amount = Number(body.amount || 0);
      const method = String(body.method || "card");
      if (!Number.isFinite(amount) || amount <= 0) return sendJson(res, 400, { error: "Укажите корректную сумму." });
      if (!matches(String(body.amount || ""), patterns.amount)) return sendJson(res, 400, { error: "Некорректная сумма пополнения." });
      if (method === "card") {
        if (amount < 3) return sendJson(res, 400, { error: "Минимальная сумма оплаты картой составляет 3 BYN." });
        const cardNumber = String(body.cardNumber || "").replace(/\s+/g, "");
        const cardHolder = String(body.cardHolder || "").trim().toUpperCase();
        const expiry = String(body.expiry || "").trim();
        const cvv = String(body.cvv || "").trim();
        if (!matches(cardNumber, patterns.cardNumber) || !matches(cardHolder, patterns.cardHolder) || !matches(expiry, patterns.expiry) || !matches(cvv, patterns.cvv)) {
          return sendJson(res, 400, { error: "Заполните данные банковской карты." });
        }
        sessionUser.balance = Number(sessionUser.balance || 0) + amount;
        sessionUser.bonusPoints = Number(sessionUser.bonusPoints || 0) + Math.floor(amount);
        pushOperation(db, sessionUser, "Пополнение картой", amount, `Пополнение баланса картой ****${cardNumber.slice(-4)}`);
        pushNotification(db, sessionUser, "Баланс пополнен", `Платёж на сумму ${amount.toFixed(2)} BYN выполнен успешно.`);
      } else if (method === "promised-payment") {
        if (amount > 25) return sendJson(res, 400, { error: "Обещанный платёж не может превышать 25 BYN." });
        sessionUser.balance = Number(sessionUser.balance || 0) + amount;
        pushOperation(db, sessionUser, "Обещанный платёж", amount, "Активирован обещанный платёж");
        pushNotification(db, sessionUser, "Обещанный платёж активирован", `На баланс зачислено ${amount.toFixed(2)} BYN как обещанный платёж.`);
      } else {
        return sendJson(res, 400, { error: "Неизвестный способ пополнения." });
      }
      await writeDb(db);
      return sendJson(res, 200, { user: sanitizeUser(sessionUser, db) });
    }

    if (req.method === "POST" && req.url === "/api/client/tariff") {
      const body = await parseBody(req);
      const tariff = getTariff(db, String(body.tariffId || ""));
      if (!tariff) return sendJson(res, 404, { error: "Тариф не найден." });
      const currentTariff = getTariff(db, sessionUser.tariffId);
      if (currentTariff && currentTariff.id === tariff.id) return sendJson(res, 400, { error: "Этот тариф уже активен." });
      const downgradeFee = currentTariff && Number(tariff.monthlyPrice || 0) < Number(currentTariff.monthlyPrice || 0) ? 5 : 0;
      if (downgradeFee && !body.confirmDowngrade) {
        return sendJson(res, 409, { error: "При смене на более дешёвый тариф спишется 5 BYN.", requiresConfirmation: true, fee: downgradeFee });
      }
      sessionUser.tariffId = tariff.id;
      if (downgradeFee) {
        sessionUser.balance = Number(sessionUser.balance || 0) - downgradeFee;
        pushOperation(db, sessionUser, "Списание за смену тарифа", -downgradeFee, "Разовое списание за переход на более доступный тариф.");
      }
      pushOperation(db, sessionUser, "Смена тарифа", 0, `Подключён тариф ${tariff.name}`);
      pushNotification(db, sessionUser, "Тариф изменён", `Теперь у вас активен тариф ${tariff.name}.`);
      await writeDb(db);
      return sendJson(res, 200, { user: sanitizeUser(sessionUser, db), downgradeFee });
    }

    if (req.method === "POST" && req.url === "/api/client/services/toggle") {
      const body = await parseBody(req);
      const service = db.services.find((item) => item.id === String(body.serviceId || ""));
      if (!service) return sendJson(res, 404, { error: "Услуга не найдена." });
      sessionUser.connectedServiceIds = sessionUser.connectedServiceIds || [];
      const connected = sessionUser.connectedServiceIds.includes(service.id);
      const compatibleServiceIds = getCompatibleServiceIds(getTariff(db, sessionUser.tariffId) || {}, db.services);
      if (!connected && !compatibleServiceIds.includes(service.id)) {
        return sendJson(res, 400, { error: "Эта услуга не подходит для текущего тарифа." });
      }
      sessionUser.connectedServiceIds = connected
        ? sessionUser.connectedServiceIds.filter((id) => id !== service.id)
        : [...sessionUser.connectedServiceIds, service.id];
      if (!connected) sessionUser.balance = Number(sessionUser.balance || 0) - Number(service.price || 0);
      pushOperation(
        db,
        sessionUser,
        connected ? "Отключение услуги" : "Подключение услуги",
        connected ? 0 : -Number(service.price || 0),
        `${connected ? "Отключена" : "Подключена"} услуга ${service.name}`
      );
      pushNotification(db, sessionUser, connected ? "Услуга отключена" : "Услуга подключена", `${service.name} ${connected ? "отключена" : "подключена"} успешно.`);
      await writeDb(db);
      return sendJson(res, 200, { user: sanitizeUser(sessionUser, db) });
    }

    if (req.method === "POST" && req.url === "/api/client/profile") {
      const body = await parseBody(req);
        const identityError = validateClientIdentityStrict({
        fullName: body.fullName || sessionUser.fullName,
        email: sessionUser.email,
        password: body.newPassword,
        passportId: body.passportId || "",
        birthDate: body.birthDate || "",
        address: body.address || ""
      });
      if (identityError) return sendJson(res, 400, { error: identityError });
      sessionUser.fullName = String(body.fullName || sessionUser.fullName).trim();
      sessionUser.address = String(body.address || sessionUser.address).trim();
      sessionUser.birthDate = String(body.birthDate || sessionUser.birthDate).trim();
      sessionUser.passportId = String(body.passportId || sessionUser.passportId).trim().toUpperCase();
      sessionUser.preferredTheme = String(body.preferredTheme || sessionUser.preferredTheme || "light");
      sessionUser.rememberPassword = Boolean(body.rememberPassword);
      if (body.newPassword) {
        const nextPassword = hashPassword(String(body.newPassword));
        sessionUser.passwordHash = nextPassword.hash;
        sessionUser.passwordSalt = nextPassword.salt;
      }
      await writeDb(db);
      return sendJson(res, 200, { user: sanitizeUser(sessionUser, db) });
    }

    if (req.method === "POST" && req.url === "/api/client/support") {
      const body = await parseBody(req);
      const topic = String(body.topic || "").trim();
      const message = String(body.message || "").trim();
      if (!topic || !message) return sendJson(res, 400, { error: "Укажите тему и текст обращения." });
      if (!matches(topic, patterns.title) || !matches(message, patterns.message)) {
        return sendJson(res, 400, { error: "Тема или сообщение содержат недопустимые символы." });
      }
      db.meta.lastTicketId += 1;
      db.tickets.unshift({
        id: db.meta.lastTicketId,
        clientId: sessionUser.id,
        topic,
        message,
        status: "Открыт",
        createdAt: new Date().toISOString()
      });
      pushNotification(db, sessionUser, "Обращение отправлено", `Ваше обращение "${topic}" успешно создано.`);
      await writeDb(db);
      return sendJson(res, 201, { tickets: db.tickets.filter((ticket) => ticket.clientId === sessionUser.id) });
    }

    if (req.method === "GET" && req.url.startsWith("/api/client/numbers/search")) {
      const requestUrl = new URL(req.url, "http://localhost");
      const query = String(requestUrl.searchParams.get("query") || "").trim();
      const existingNumbers = new Set(getAllActiveNumbers(db));
      let options = [];
      if (query) {
        const normalizedNumber = query.startsWith("+") ? query : `+${query.replace(/^\+?/, "")}`;
        if (isBelarusMobileNumber(normalizedNumber) && !existingNumbers.has(normalizedNumber)) options = [createNumberOption(normalizedNumber)];
      }
      return sendJson(res, 200, { options });
    }

    if (req.method === "POST" && req.url === "/api/client/numbers/add") {
      const body = await parseBody(req);
      const mode = String(body.mode || "random");
      const existingNumbers = getAllActiveNumbers(db);
      let newNumber = "";
      if (mode === "specific") {
        const requestedNumber = String(body.number || "").trim();
        if (!isBelarusMobileNumber(requestedNumber)) return sendJson(res, 400, { error: "Некорректный формат номера." });
        if (existingNumbers.includes(requestedNumber)) return sendJson(res, 409, { error: "Номер уже занят." });
        newNumber = requestedNumber;
      } else {
        newNumber = randomBelarusNumber(existingNumbers);
      }
      const surcharge = calculateNumberSurcharge(newNumber);
      sessionUser.numbers.push(newNumber);
      sessionUser.balance = Number(sessionUser.balance || 0) - surcharge;
      pushOperation(db, sessionUser, "Доплата за номер", -surcharge, `Выбран номер ${newNumber}`);
      pushNotification(db, sessionUser, "Подключён новый номер", `Для вас зарезервирован номер ${newNumber}.`);
      await writeDb(db);
      return sendJson(res, 200, { user: sanitizeUser(sessionUser, db), generatedNumber: newNumber, surcharge });
    }

    if (req.method === "POST" && req.url === "/api/client/numbers/delete") {
      const body = await parseBody(req);
      const number = String(body.number || "");
      if (!sessionUser.numbers.includes(number)) return sendJson(res, 404, { error: "Номер не найден." });
      if (sessionUser.numbers.length === 1) return sendJson(res, 400, { error: "Нельзя удалить единственный номер в аккаунте." });
      sessionUser.numbers = sessionUser.numbers.filter((item) => item !== number);
      pushNotification(db, sessionUser, "Номер удалён", `Номер ${number} был удалён из аккаунта.`);
      await writeDb(db);
      return sendJson(res, 200, { user: sanitizeUser(sessionUser, db) });
    }
  }

  if (sessionUser.role !== "admin") return sendJson(res, 403, { error: "Доступ запрещён." });

  if (req.method === "POST" && req.url === "/api/admin/client/update") {
    const body = await parseBody(req);
    const client = db.users.find((user) => user.role === "client" && user.id === Number(body.clientId));
    if (!client) return sendJson(res, 404, { error: "Клиент не найден." });
      const identityError = validateClientIdentityStrict({
      fullName: body.fullName || client.fullName,
      email: client.email,
      passportId: body.passportId || "",
      birthDate: client.birthDate || "",
      address: body.address || "",
      password: ""
    });
    if (identityError) return sendJson(res, 400, { error: identityError });
    if (typeof body.balance !== "undefined" && body.balance !== null && body.balance !== "" && !matches(String(body.balance), patterns.balance)) {
      return sendJson(res, 400, { error: "Баланс указан некорректно." });
    }
    if (typeof body.fullName === "string" && body.fullName.trim()) client.fullName = body.fullName.trim();
    if (typeof body.address === "string" && body.address.trim()) client.address = body.address.trim();
    if (typeof body.passportId === "string" && body.passportId.trim()) client.passportId = body.passportId.trim().toUpperCase();
    if (typeof body.balance !== "undefined" && body.balance !== null && body.balance !== "") client.balance = Number(body.balance);
    if (typeof body.tariffId === "string" && getTariff(db, body.tariffId)) client.tariffId = body.tariffId;
    if (Array.isArray(body.connectedServiceIds)) {
      client.connectedServiceIds = body.connectedServiceIds.filter((id) => db.services.some((service) => service.id === id));
    }
    if (typeof body.simStatus === "string" && body.simStatus.trim()) client.simStatus = body.simStatus.trim();
    pushNotification(db, client, "Данные обновлены администратором", "Ваш профиль был обновлён сотрудником оператора.");
    await writeDb(db);
    return sendJson(res, 200, { client: sanitizeUser(client, db) });
  }

  if (req.method === "POST" && req.url === "/api/admin/mailing") {
    const body = await parseBody(req);
    const title = String(body.title || "").trim();
    const message = String(body.message || "").trim();
    const filter = body.filter || { mode: "all" };
    if (!title || !message) return sendJson(res, 400, { error: "Укажите тему и текст рассылки." });
    if (!matches(title, patterns.title) || !matches(message, patterns.message)) {
      return sendJson(res, 400, { error: "Тема или текст рассылки содержат недопустимые символы." });
    }
    const recipients = filterClientsByMailing(db, filter);
    if (!recipients.length) return sendJson(res, 400, { error: "По выбранному фильтру не найдено получателей." });
    recipients.forEach((client) => pushNotification(db, client, title, message));
    db.meta.lastMailingId += 1;
    db.mailingHistory.unshift({
      id: db.meta.lastMailingId,
      title,
      message,
      sentAt: new Date().toISOString(),
      recipientsCount: recipients.length,
      filter
    });
    await writeDb(db);
    return sendJson(res, 201, { mailingHistory: db.mailingHistory });
  }

  if (req.method === "POST" && req.url === "/api/admin/ticket/status") {
    const body = await parseBody(req);
    const ticket = db.tickets.find((item) => item.id === Number(body.ticketId));
    if (!ticket) return sendJson(res, 404, { error: "Обращение не найдено." });
    ticket.status = String(body.status || ticket.status);
    const client = db.users.find((user) => user.id === ticket.clientId);
    if (client) pushNotification(db, client, "Статус обращения обновлён", `Обращение "${ticket.topic}" переведено в статус "${ticket.status}".`);
    await writeDb(db);
    return sendJson(res, 200, { tickets: db.tickets });
  }

  return sendJson(res, 404, { error: "Маршрут не найден." });
}

const server = http.createServer(async (req, res) => {
  try {
    applyCors(req, res);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.url.startsWith("/api/")) return await handleApi(req, res);
    serveStatic(req, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Внутренняя ошибка сервера." });
  }
});

ensureDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize MongoDB:", error.message);
    process.exit(1);
  });

