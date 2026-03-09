# Мобильная адаптация — Журнал изменений

**Дата:** 05.03.2026  
**Коммит:** `3cad2c5`  
**Файл:** `style.css` (единственный изменённый файл)

---

## Что было исправлено

### 1. Хедер — touch-targets
- Иконки соцсетей (Viber, WhatsApp, Telegram) увеличены с **36×36px → 44×44px**
- Кнопка бургер-меню: добавлен `min-width/min-height: 44px`
- Ссылки мобильного меню: `min-height: 44px` для удобного нажатия
- Убран `min-width: max-content` у `.header__actions` — вызывал горизонтальный оверфлоу

### 2. Hero-секция — кнопки CTA
- **Проблема:** кнопки «Связаться с нами» и «Смотреть цены» стояли в ряд (`flex-direction: row`) при `width: 100%`, что математически невозможно на экране 375px
- **Решение:** `flex-direction: column` на `@media (max-width: 768px)`, кнопки теперь стакаются вертикально
- Добавлен `min-height: 44px` для кнопок

### 3. Hero — фоновый текст "POZIT"
- При 480px: `font-size: 70px`, центрирование через `left: 50%; transform: translateX(-50%)`
- При 320px: `font-size: 56px`
- Ранее текст размером 110px+ вылезал за правый край экрана

### 4. Hero — заголовок и подзаголовок
- `product-title`: 36px → **32px** (480px), **28px** (320px)
- `product-subtitle`: **15px** на мобильных
- `brand-name`: **16px** на мобильных

### 5. Контейнер — отступы
- При ≤480px: `padding: 0 16px` (было 20px)
- При ≤320px: `padding: 0 12px`
- Хедер-контейнер аналогично уменьшен

### 6. Карточки цен (Services/Pricing)
- Padding карточек: **20px 16px** (480px), **16px 12px** (320px)
- Убран `white-space: nowrap` у `.price-list li strong` — цены теперь могут переноситься
- Уменьшен шрифт прайс-листа: **12px** (480px), **11px** (320px)
- Модификаторы цен: уменьшен padding и размер бейджа

### 7. Before/After галерея
- **Проблема:** `grid-template-columns: repeat(auto-fill, minmax(400px, 1fr))` — минимум 400px не помещался на 375px экране
- **Решение:** `minmax(min(400px, 100%), 1fr)` — используется CSS функция `min()` для ограничения

### 8. Отзывы (Reviews)
- **Проблема:** карточки отзывов фиксированные 300px — выходили за viewport
- **Решение при ≤576px:** `flex: 0 0 calc(100vw - 60px)` — адаптивный размер
- **При ≤320px:** `flex: 0 0 calc(100vw - 40px)`
- Уменьшены стрелки навигации до 40px

### 9. Заголовки секций
- `section-title` при 480px: **24px** (было 28px)
- `section-title` при 320px: **20px**
- `section-subtitle`: **11px**, `letter-spacing: 2px`

### 10. Отступы секций
- Все секции уменьшены с 100px → **60px** (480px) или **50px/40px** для некоторых
- Timeline, Process, Materials, Guarantee, FAQ, Reviews, Contacts, Footer — все обновлены

### 11. Блок качества работ
- `guarantee-box` padding: **24px 16px** (было 30px 20px)
- `border-radius: 12px`
- Уменьшен размер CTA кнопки внутри

### 12. Контакты
- Фоновый текст: **24vw** на 480px (было 32vw)
- `.v3-card` padding: **24px 16px**
- `.v3-title`: **22px** (480px), **20px** (320px)
- Карточки оплаты: padding **16px**, иконка **48px**

### 13. Карта и адрес
- `.map-card` высота: **350px** на 480px
- `.map-card-address` padding: **16px**
- `.map-route-btn` padding: **12px 16px**

### 14. Футер
- Padding: **40px 0** на мобильных
- Ссылки навигации: **11px**, gap **12px**

### 15. FAB-кнопки
- Позиция: **16px** от краёв (было 20px)
- Уменьшен padding и шрифт

---

## Новые медиа-запросы

```css
@media (max-width: 480px) { /* ~60 правил */ }
@media (max-width: 320px) { /* ~10 правил */ }
```

## Проверено на разрешениях

| Ширина | Устройство | Статус |
|:---|:---|:---|
| 320px | iPhone SE (старый) | ✅ OK |
| 375px | iPhone X / SE | ✅ OK |
| 414px | iPhone Plus | ✅ OK |
| 768px | iPad Portrait | ✅ OK |
| 1024px | iPad Landscape | ✅ OK |
| 1440px | Desktop | ✅ Без регрессий |