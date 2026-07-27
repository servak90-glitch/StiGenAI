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

Вы можете использовать студию как идеальный генератор промтов для внешней работы (Midjourney, DALL-E 3, Stable Diffusion) или **подключить собственный Google Gemini API ключ** прямо в интерфейсе и генерировать стикеры, векторы и дизайн-паки в один клик.

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

4. **🤖 Прямая генерация через Gemini API**
   * Введите свой бесплатный API ключ из Google AI Studio на главном экране.
   * Поддержка свежайших визуальных моделей Google (Gemini 2.5, Imagen 3, Pro/Flash).

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

Use it as an advanced prompt crafting workstation for external tools (Midjourney, Stable Diffusion, DALL-E) or **plug in your Google Gemini API key** right on the main screen to generate stickers, brand assets, and vectors instantly.

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

4. **🤖 Direct Gemini API Integration**
   * Simply paste your Google AI Studio API key directly into the header settings.
   * Native support for Google's latest image models (Gemini 2.5, Imagen 3).

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
