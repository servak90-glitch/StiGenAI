# 🎨 Sticker & Vector AI Studio (StigenAI)

<p align="center">
  <img src="public/icon.png" width="128" height="128" alt="StigenAI Logo" />
</p>

<p align="center">
  <b>Универсальный ИИ-конструктор промтов, профессиональный векторизатор в SVG и ультра-апскейлер со встроенной интеграцией Google Gemini API.</b><br>
  <i>All-in-one AI Prompt Constructor, High-Precision SVG Vectorizer, and Ultra-Upscaler powered by Google Gemini API.</i>
</p>

<p align="center">
  <a href="#-русский"><img src="https://img.shields.io/badge/Language-Русский-blue.svg" alt="Russian"></a>
  <a href="#-english"><img src="https://img.shields.io/badge/Language-English-red.svg" alt="English"></a>
  <a href="https://aistudio.google.com/"><img src="https://img.shields.io/badge/Powered%20By-Google%20Gemini-orange.svg" alt="Gemini"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License"></a>
</p>

---

## 🇷🇺 Русский

### 🌟 О проекте

**StigenAI Studio** — это мощная веб-платформа и десктоп-инструмент для иллюстраторов, дизайнеров и мейкеров. Приложение объединяет в себе **умный конструктор арт-промтов**, **профессиональный SVG-векторизатор** и **мощный ИИ-апскейлер**.

Программа поддерживает два ключевых режима работы: **автономный (без API ключа)** для составления готовых промтов и векторной обработки файлов, а также **интерактивный** с подключением вашего собственного Google Gemini API ключа для генерации изображений прямо в интерфейсе.

---

### 💡 Как использовать в Автономном режиме (Без API ключа)

Вам не обязательно подключать нейросеть, чтобы использовать программу на 100%!

#### 🎯 Пошаговый сценарий работы с конструктором промтов:
1. **Нажмите кнопку «Начать творить»** на главном экране.
2. **Выберите стиль и настройте параметры**: укажите ваш объект, выберите художественный стиль, толщину контура, освещение, эмоции и ракурс.
3. **Скопируйте промт**: нажмите кнопку **«Скопировать промт»** (или иконку буфера обмена в шапке).
4. **Используйте в любой нейросети**: вставьте готовый идеальный англоязычный промт в **Midjourney**, **DALL-E 3**, **Stable Diffusion**, **Flux**, **Leonardo AI** или любую другую графическую нейросеть.

#### ⚡ Локальная работа с вектором и полиграфией:
* **SVG-векторизатор**: Загрузите любое растровое изображение (PNG/JPG), удалите фон и скомпилируйте его в чистый **SVG-вектор**.
* **Print Master**: Компонуйте и подготавливайте полученные стикеры к печати и плоттерной резке.

---

### 🔥 Ключевые возможности

1. **🧠 Умный Конструктор Промтов (Prompt Builder)**
   * Собирайте идеальные промты с помощью пресетов стилей, контуров, эмоций, планов и подписей.
   * Конструктор стикер-паков (Sticker Pack Generator) — создавайте целые наборы эмоций для персонажей.
   * Копирование готовых промтов в один клик под любую нейросеть.

2. **⚡ Векторизатор изображения в SVG (Vector Tracer)**
   * Превращайте растровые картинки (PNG/JPG) в чистые скалируемые **SVG-векторы**.
   * Умное сглаживание углов, оптимизация контуров и настройка цвета.
   * Поддержка авто-удаления фона перед трассировкой.

3. **🔍 ИИ-Апскейлер высокого разрешения (AI Upscaler)**
   * Детализация и увеличение четкости изображений для печати и веб-дизайна.
   * Удаление шумов и артефактов с сохранением стиля.

4. **🤖 Прямая генерация через Gemini API (Опционально)**
   * Введите свой API ключ из Google AI Studio на главном экране.
   * Поддержка свежайших визуальных моделей Google.

5. **🎨 Дополнительные студии и инструменты:**
   * **Style Scanner & Transposer:** Сканируйте стили с любых картинок и перенос стиля на новые арт-объекты.
   * **Card & Brand Generator:** Генератор визиток, мерча и бренд-буков.
   * **Print Master:** Подготовка макетов к полиграфии и печати.

---

### 🚀 Быстрый запуск

#### Для Windows:
Запустите файл **`start.bat`** — он автоматически установит зависимости, откроет браузер на `http://localhost:3000` и запустит программу.

#### Для macOS / Linux:
Запустите в терминале:
```bash
chmod +x start.sh
./start.sh
```

#### Ручной запуск (для разработчиков):
```bash
npm install
npm run dev
```

---

<br>

## 🇬🇧 English

### 🌟 About The Project

**StigenAI Studio** is a feature-rich visual workbench engineered for illustrators, graphic designers, and content creators. It combines a **smart AI prompt builder**, an **industrial-grade SVG vectorizer**, and an **AI-powered upscaler**.

It operates seamlessly in **Standalone Mode (No API key required)** as a prompt engineer & local vectorizer, or in **Integrated Mode** by connecting your Google Gemini API key for instant in-app generation.

---

### 💡 How to Use in Standalone / Offline Mode (No API Key Required)

You do not need an API key or active AI subscription to get maximum value from StigenAI:

#### 🎯 Step-by-Step Prompt Constructor Workflow:
1. **Click "Start Creating" ("Начать творить")** on the main dashboard.
2. **Select Style & Options**: Define your subject, choose art style presets, stroke thickness, framing, mood, and lighting.
3. **Copy the Prompt**: Click the **"Copy Prompt"** button (or the clipboard icon in the top toolbar).
4. **Paste into Any Image Generator**: Use your freshly minted, highly optimized prompt inside **Midjourney**, **DALL-E 3**, **Stable Diffusion**, **Flux**, or **Leonardo AI**.

#### ⚡ Local Vector & Layout Tools:
* **Raster-to-SVG Vectorizer**: Drag & drop PNG/JPG artwork, clean background, and vectorize into crisp **SVG vectors**.
* **Print Master Studio**: Arrange stickers and graphics on print sheets for plotter cutting.

---

### 🔥 Key Features

1. **🧠 Smart AI Prompt Builder**
   * Fine-tune artistic prompts with style presets, line-weight controls, character emotions, and layouts.
   * **Sticker Pack Studio:** Generate cohesive emotion sets for custom characters.
   * One-click copying of optimized prompt strings for any generative AI.

2. **⚡ Raster-to-SVG Vectorizer**
   * Convert PNG/JPG images into clean, scalable, multi-path **SVG vector files**.
   * Customizable threshold, curve smoothing, color reduction, and outline tracing.
   * Built-in background removal prior to vectorization.

3. **🔍 High-Definition AI Upscaler**
   * Enhance image resolution and sharp details ready for physical printing or high-res display.
   * Denoising and edge enhancement preserving the original art style.

4. **🤖 Direct Gemini API Integration (Optional)**
   * Simply paste your Google AI Studio API key directly into the header settings.
   * Native support for Google's latest image models.

5. **🎨 Integrated Creative Suites:**
   * **Style Scanner & Transposer:** Extract aesthetic DNA from reference images and transpose onto new subjects.
   * **Brand & Card Builder:** Generate corporate identity kits and business cards.
   * **Print Master:** Layout generator for merch and print collateral.

---

### 🚀 Quick Start

#### Windows:
Double-click **`start.bat`** — it installs dependencies, launches the server at `http://localhost:3000`, and opens your browser automatically.

#### macOS / Linux:
Run in terminal:
```bash
chmod +x start.sh
./start.sh
```

#### Developer Mode:
```bash
npm install
npm run dev
```

---

### 🛠️ Tech Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Vector Engine:** Custom Potrace SVG engine & WebAssembly background processor
- **AI Backend:** Google GenAI SDK (`@google/genai`)
- **Build System:** Vite

---

### 📄 License
Distributed under the MIT License.
