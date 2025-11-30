/**
 * Validation utilities for SpaarBot frontend
 * Client-side validation для форм и данных
 */

/**
 * Валидация суммы транзакции
 */
export const validateAmount = (amount: string | number): { valid: boolean; error?: string } => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return { valid: false, error: 'Invalid amount format' };
  }

  if (numAmount <= 0) {
    return { valid: false, error: 'Amount must be positive' };
  }

  if (numAmount > 1000000) {
    return { valid: false, error: 'Amount too large (max €1,000,000)' };
  }

  // Проверка на 2 знака после запятой
  if (Math.round(numAmount * 100) / 100 !== numAmount) {
    return { valid: false, error: 'Amount can have maximum 2 decimal places' };
  }

  return { valid: true };
};

/**
 * Валидация описания транзакции
 */
export const validateDescription = (description: string): { valid: boolean; error?: string } => {
  if (!description || description.trim().length === 0) {
    return { valid: false, error: 'Description is required' };
  }

  if (description.length > 500) {
    return { valid: false, error: 'Description too long (max 500 characters)' };
  }

  // Базовая проверка на SQL injection patterns
  const dangerousPatterns = [
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(--|;|\/\*|\*\/)/
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(description)) {
      return { valid: false, error: 'Invalid characters in description' };
    }
  }

  return { valid: true };
};

/**
 * Валидация категории
 */
export const validateCategory = (categoryId: number | string): { valid: boolean; error?: string } => {
  const id = typeof categoryId === 'string' ? parseInt(categoryId) : categoryId;

  if (isNaN(id) || id <= 0) {
    return { valid: false, error: 'Invalid category' };
  }

  return { valid: true };
};

/**
 * Валидация даты
 */
export const validateDate = (date: string): { valid: boolean; error?: string } => {
  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  // Дата не может быть в будущем
  if (parsedDate > new Date()) {
    return { valid: false, error: 'Date cannot be in the future' };
  }

  // Дата не может быть старше 10 лет
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

  if (parsedDate < tenYearsAgo) {
    return { valid: false, error: 'Date too far in the past' };
  }

  return { valid: true };
};

/**
 * Валидация email
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (email.length > 254) {
    return { valid: false, error: 'Email too long' };
  }

  return { valid: true };
};

/**
 * Валидация PayPal email
 */
export const validatePayPalEmail = (email: string): { valid: boolean; error?: string } => {
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return emailValidation;
  }

  // Дополнительные проверки для PayPal если нужно
  return { valid: true };
};

/**
 * Валидация URL
 */
export const validateUrl = (url: string): { valid: boolean; error?: string } => {
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
};

/**
 * Валидация feedback message
 */
export const validateFeedbackMessage = (message: string): { valid: boolean; error?: string } => {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: 'Message is required' };
  }

  if (message.length < 10) {
    return { valid: false, error: 'Message too short (min 10 characters)' };
  }

  if (message.length > 2000) {
    return { valid: false, error: 'Message too long (max 2000 characters)' };
  }

  return { valid: true };
};

/**
 * Валидация subscription plan
 */
export const validateSubscriptionPlan = (planId: string): { valid: boolean; error?: string } => {
  // Проверка формата PayPal plan ID
  if (!planId || planId.trim().length === 0) {
    return { valid: false, error: 'Plan ID is required' };
  }

  // PayPal plan ID обычно имеет формат P-XXXXXXXXXXXXXXXXX
  const planIdRegex = /^P-[A-Z0-9]+$/;
  if (!planIdRegex.test(planId)) {
    return { valid: false, error: 'Invalid PayPal plan ID format' };
  }

  return { valid: true };
};

/**
 * Валидация языка
 */
export const validateLanguage = (lang: string): { valid: boolean; error?: string } => {
  const validLanguages = ['de', 'en', 'ru', 'uk'];

  if (!validLanguages.includes(lang)) {
    return { valid: false, error: 'Invalid language code' };
  }

  return { valid: true };
};

/**
 * Валидация Telegram ID
 */
export const validateTelegramId = (telegramId: number | string): { valid: boolean; error?: string } => {
  const id = typeof telegramId === 'string' ? parseInt(telegramId) : telegramId;

  if (isNaN(id) || id <= 0) {
    return { valid: false, error: 'Invalid Telegram ID' };
  }

  return { valid: true };
};

/**
 * Валидация периода для статистики
 */
export const validateTimePeriod = (period: string): { valid: boolean; error?: string } => {
  const validPeriods = ['today', 'week', 'month', '3months', '6months', 'year'];

  if (!validPeriods.includes(period)) {
    return { valid: false, error: 'Invalid time period' };
  }

  return { valid: true };
};

/**
 * Валидация диапазона дат
 */
export const validateDateRange = (
  startDate: string,
  endDate: string
): { valid: boolean; error?: string } => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  if (start > end) {
    return { valid: false, error: 'Start date must be before end date' };
  }

  // Максимум 1 год
  const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
  if (end.getTime() - start.getTime() > oneYearInMs) {
    return { valid: false, error: 'Date range too large (max 1 year)' };
  }

  return { valid: true };
};

/**
 * Валидация имени пользователя
 */
export const validateUserName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Name too long (max 100 characters)' };
  }

  // Только буквы, пробелы и некоторые спецсимволы
  const nameRegex = /^[a-zA-ZäöüÄÖÜßа-яА-ЯіїєІЇЄ\s'-]+$/;
  if (!nameRegex.test(name)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }

  return { valid: true };
};

/**
 * Валидация полной формы транзакции
 */
export const validateTransactionForm = (data: {
  amount: string | number;
  description: string;
  categoryId: number | string;
  date?: string;
}): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  const amountValidation = validateAmount(data.amount);
  if (!amountValidation.valid) {
    errors.amount = amountValidation.error!;
  }

  const descriptionValidation = validateDescription(data.description);
  if (!descriptionValidation.valid) {
    errors.description = descriptionValidation.error!;
  }

  const categoryValidation = validateCategory(data.categoryId);
  if (!categoryValidation.valid) {
    errors.categoryId = categoryValidation.error!;
  }

  if (data.date) {
    const dateValidation = validateDate(data.date);
    if (!dateValidation.valid) {
      errors.date = dateValidation.error!;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Валидация формы feedback
 */
export const validateFeedbackForm = (data: {
  name?: string;
  email?: string;
  message: string;
}): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (data.name) {
    const nameValidation = validateUserName(data.name);
    if (!nameValidation.valid) {
      errors.name = nameValidation.error!;
    }
  }

  if (data.email) {
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.valid) {
      errors.email = emailValidation.error!;
    }
  }

  const messageValidation = validateFeedbackMessage(data.message);
  if (!messageValidation.valid) {
    errors.message = messageValidation.error!;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitize input (очистка от опасных символов)
 */
export const sanitizeInput = (input: string, maxLength: number = 500): string => {
  if (!input) return '';

  // Обрезаем до максимальной длины
  let sanitized = input.substring(0, maxLength);

  // Убираем null bytes
  sanitized = sanitized.replace(/\x00/g, '');

  // Убираем множественные пробелы
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Trim
  sanitized = sanitized.trim();

  return sanitized;
};

/**
 * Format amount для отображения
 */
export const formatAmount = (amount: number, currency: string = 'EUR'): string => {
  const formatted = amount.toFixed(2);

  if (currency === 'EUR') {
    return `€${formatted}`;
  } else if (currency === 'USD') {
    return `$${formatted}`;
  } else {
    return `${formatted} ${currency}`;
  }
};

/**
 * Parse amount from string
 */
export const parseAmount = (amountStr: string): number | null => {
  // Убираем символ валюты
  let cleaned = amountStr.replace(/[€$]/g, '').trim();

  // Заменяем запятую на точку
  cleaned = cleaned.replace(',', '.');

  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) {
    return null;
  }

  return Math.round(parsed * 100) / 100; // Округляем до 2 знаков
};