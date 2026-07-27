
// ... existing imports

export const translations: Record<string, { ru: string; en: string }> = {
    // ... (keep existing translations up to guide.menu section) ...
    'action.next': { ru: 'Далее', en: 'Next' },
    'action.back': { ru: 'Назад', en: 'Back' },
    'action.finish': { ru: 'Готово', en: 'Finish' },
    'action.save': { ru: 'Сохранить', en: 'Save' },
    'action.cancel': { ru: 'Отмена', en: 'Cancel' },
    'action.close': { ru: 'Закрыть', en: 'Close' },
    'action.upload': { ru: 'Загрузить', en: 'Upload' },
    'action.download': { ru: 'Скачать', en: 'Download' },
    'action.copy': { ru: 'Копировать', en: 'Copy' },
    'action.clickToUpload': { ru: 'Нажмите для загрузки', en: 'Click to Upload' },
    'action.remove': { ru: 'Удалить', en: 'Remove' },
    'action.downloadResult': { ru: 'Скачать результат', en: 'Download Result' },
    'action.downloadBatch': { ru: 'Скачать пакет', en: 'Download Batch' },
    'action.zipping': { ru: 'Архивация...', en: 'Zipping...' },
    'action.logout': { ru: 'Выйти', en: 'Logout' },
    'action.vectorize': { ru: 'Векторизовать и скачать', en: 'Vectorize & Download' },
    'action.deleteShort': { ru: 'Удалить', en: 'Del' },

    // --- Common Status & Errors ---
    'status.silhouetteAnalysis': { ru: '👁️ AI Анализ силуэта...', en: '👁️ AI Silhouette Analysis...' },
    'status.vectorPaths': { ru: '✂️ Построение векторных путей...', en: '✂️ Constructing Vector Paths...' },
    'status.finalTrace': { ru: '✒️ Финальная трассировка...', en: '✒️ Final Vector Trace...' },
    'status.tracing': { ru: 'Трассировка...', en: 'Tracing...' },
    'status.analyzing': { ru: 'Анализ структуры...', en: 'Analyzing structure...' },
    'status.binarization': { ru: 'Умная бинаризация...', en: 'Smart Binarization...' },
    'status.fitting': { ru: 'Аппроксимация кривых...', en: 'Fitting Curves...' },
    'status.optimizing': { ru: '🧹 Очистка слоев (SVGO)...', en: '🧹 Cleaning Layers (SVGO)...' },
    'error.analysisFailed': { ru: 'Ошибка анализа: ', en: 'Analysis failed: ' },
    'error.forgeFailed': { ru: 'Ошибка синтеза', en: 'Forge failed' },
    'error.logoGenerationFailed': { ru: 'Ошибка генерации логотипа', en: 'Logo generation failed' },
    'error.noImageAI': { ru: 'ИИ не вернул изображение', en: 'No image data returned from AI' },
    'error.licenseLimit': { ru: 'Лимит лицензии исчерпан', en: 'License limit reached' },
    'error.limitReached': { ru: 'Лимит генераций исчерпан', en: 'Generation limit reached' },
    'error.proKeyRequired': { ru: 'Для Pro модели требуется платный ключ. Пожалуйста, выберите его.', en: 'Pro tier requires a paid API key. Please select one.' },
    'error.visionScanFailed': { ru: 'Ошибка сканирования', en: 'Vision scan failed' },
    'error.brandForgeFailed': { ru: 'Ошибка создания бренда', en: 'Brand Forge Failed' },
    'error.generationFailed': { ru: 'Ошибка генерации', en: 'Generation failed' },
    'error.apiKey': { ru: 'Для модели Pro требуется платный API ключ. Пожалуйста, выберите его.', en: 'Pro tier requires a paid API key. Please select one.' },
    'error.noImage': { ru: 'ИИ не вернул изображение', en: 'No image data returned from AI' },
    'error.packFailed': { ru: 'Не удалось создать стикерпак', en: 'Pack generation failed' },

    // --- Export Modal ---
    'export.title': { ru: 'Экспорт и Шеринг', en: 'Export & Share' },
    'export.subtitle': { ru: 'Отправьте стикеры прямо в мессенджеры', en: 'Send stickers directly to messengers' },
    'export.native': { ru: 'Быстрая отправка', en: 'Quick Share' },
    'export.native.desc': { ru: 'Использовать нативное меню телефона (Telegram, WhatsApp)', en: 'Use native OS menu (Telegram, WhatsApp)' },
    'export.files': { ru: 'Файлы', en: 'Files' },
    'export.action.share': { ru: 'Поделиться', en: 'Share' },
    'export.action.telegram': { ru: 'В Telegram', en: 'To Telegram' },
    'export.action.whatsapp': { ru: 'В WhatsApp', en: 'To WhatsApp' },
    'export.error.unsupported': { ru: 'Ваш браузер не поддерживает прямой шеринг файлов.', en: 'Your browser does not support direct file sharing.' },

    // --- Notifications ---
    'notification.presets.emptyName': { ru: 'Введите название пресета', en: 'Enter preset name' },
    'notification.presets.saved': { ru: 'Пресет "{name}" сохранен', en: 'Preset "{name}" saved' },
    'notification.presets.loadFailed': { ru: 'Ошибка загрузки пресетов', en: 'Failed to load presets' },
    'notification.presets.applied': { ru: 'Пресет "{name}" применен', en: 'Preset "{name}" applied' },
    'notification.presets.deletedAndReset': { ru: 'Пресет удален, настройки сброшены', en: 'Preset deleted, settings reset' },
    'notification.presets.deleted': { ru: 'Пресет удален', en: 'Preset deleted' },
    'notification.settings.reset': { ru: 'Настройки сброшены по умолчанию', en: 'Settings reset to default' },
    'notification.logout.success': { ru: 'Вы успешно вышли', en: 'Logged out successfully' },
    'notification.styleDeleted': { ru: 'Стиль удален', en: 'Style deleted' },
    'notification.adminAccess': { ru: 'Админ-доступ: Используйте экран блокировки', en: 'Admin Access: Use Lock Screen' },
    'notification.availablePremium': { ru: 'Доступно в Premium плане', en: 'Available in Premium Plan' },
    'notification.upgradeStickers': { ru: 'Обновите лицензию для стикеров', en: 'Upgrade license to create stickers' },
    'notification.requiresActive': { ru: 'Требуется активный план', en: 'Requires Active Plan' },
    'notification.availableVector': { ru: 'Доступно в Vector плане', en: 'Available in Vector Plan' },
    'notification.availableB2B': { ru: 'Доступно в B2B плане', en: 'Available in B2B Plan' },
    'notification.availablePro': { ru: 'Доступно в Pro плане', en: 'Available in Pro Plan' },

    // --- Preview & Header ---
    'preview.copied': { ru: 'Скопировано!', en: 'Copied!' },
    'preview.copy': { ru: 'Копировать JSON', en: 'Copy JSON' },
    'preview.reset': { ru: 'Сброс', en: 'Reset' },
    'header.title': { ru: 'StiGenAi', en: 'StiGenAi' },
    'header.title.mobile': { ru: 'StiGenAi', en: 'StiGenAi' },
    'header.subtitle': { ru: 'Профессиональный ИИ-конструктор стикеров', en: 'Professional AI Sticker Suite' },
    'header.wizard': { ru: 'Быстрый стикер', en: 'Quick Sticker' },
    'header.history': { ru: 'История', en: 'History' },
    'header.scanner': { ru: 'Сканер стиля', en: 'Style Scanner' },
    'header.instructions': { ru: 'Руководство', en: 'Guidebook' },
    'header.whatsNew': { ru: 'Что нового', en: "What's New" },
    'header.prompt': { ru: 'Промпт', en: 'Prompt' },
    'header.forge': { ru: 'Кузница', en: 'Forge' },
    
    // --- Mobile Menu ---
    'menu.title': { ru: 'Меню', en: 'Menu' },
    'menu.tools': { ru: 'Инструменты', en: 'Tools' },
    'menu.app': { ru: 'Приложение', en: 'App' },
    'menu.adminZone': { ru: 'Зона администратора', en: 'Admin Zone' },
    'menu.keyGen': { ru: 'Генератор ключей', en: 'Key Generator' },

    // --- Presets Manager ---
    'presets.title': { ru: 'Мои пресеты', en: 'My Presets' },
    'presets.placeholder': { ru: 'Название пресета...', en: 'Preset name...' },
    'presets.update': { ru: 'Обновить', en: 'Update' },
    'presets.save': { ru: 'Сохранить', en: 'Save' },
    'presets.delete': { ru: 'Удалить', en: 'Delete' },
    'presets.confirmDelete': { ru: 'Вы уверены, что хотите удалить этот пресет?', en: 'Are you sure you want to delete this preset?' },
    'presets.modal.cancel': { ru: 'Отмена', en: 'Cancel' },

    // --- Patch Notes ---
    'patchNotes.title': { ru: 'История изменений', en: 'Patch Notes' },
    'patchNotes.close': { ru: 'Закрыть', en: 'Close' },
    'patchNotes.warning.title': { ru: 'Важно', en: 'Important' },
    'patchNotes.warning.content': { ru: 'Приложение активно развивается. Возможны изменения в интерфейсе.', en: 'The app is under active development. UI changes may occur.' },
    'patchNotes.contact.title': { ru: 'Обратная связь', en: 'Feedback' },
    'patchNotes.contact.content': { ru: 'Нашли баг или есть идея? Пишите: <a href="mailto:servak90@gmail.com" class="text-blue-500 underline">servak90@gmail.com</a>', en: 'Found a bug or have an idea? Contact: <a href="mailto:servak90@gmail.com" class="text-blue-500 underline">servak90@gmail.com</a>' },
    'patchNotes.history.title': { ru: 'Версии', en: 'History' },
    'patchNotes.versions': {
        ru: JSON.stringify([
            {
                version: "6.9.1",
                changes: [
                    "Исправлена локализация панели генератора",
                    "Обновлен механизм кеширования",
                    "Подготовка к пользовательским UI"
                ]
            }
        ]),
        en: JSON.stringify([
            {
                version: "6.9.1",
                changes: [
                    "Fixed localization in generator panel",
                    "Updated caching mechanism",
                    "Prep for custom UI injection"
                ]
            }
        ])
    },

    // --- Transposer ---
    'transposer.title': { ru: 'Style Transposer', en: 'Style Transposer' },
    'transposer.subtitle': { ru: 'Перенос стиля с ваших референсов на любое фото', en: 'Transfer style from references to any photo' },
    'transposer.styleSources': { ru: 'Источники стиля (до 10)', en: 'Style Sources (up to 10)' },
    'transposer.targetObject': { ru: 'Объект для стилизации', en: 'Stylization Target' },
    'transposer.action.extract': { ru: 'Сканировать ДНК', en: 'Scan DNA' },
    'transposer.action.forge': { ru: 'Синтезировать результат', en: 'Forge Result' },
    'transposer.action.saveToLibrary': { ru: 'Сохранить в библиотеку', en: 'Save to Library' },
    'transposer.action.changeImage': { ru: 'Сменить фото', en: 'Change Image' },
    'transposer.status.extracting': { ru: 'ИИ анализирует стиль...', en: 'AI analyzing style...' },
    'transposer.status.generating': { ru: 'Синтез изображения...', en: 'Forging image...' },
    'transposer.status.ready': { ru: 'Готов к синтезу', en: 'Ready to Forge' },
    'transposer.status.dnaExtracted': { ru: 'ДНК Извлечен', en: 'DNA Extracted' },
    'transposer.ready': { ru: 'Стиль извлечен и готов к применению', en: 'Style extracted and ready to use' },
    'transposer.info': { ru: 'Загрузите картинки-примеры слева и фото объекта справа.', en: 'Upload style examples on the left and target photo on the right.' },
    'transposer.resultTitle': { ru: 'Результат переноса', en: 'Transposed Result' },
    'transposer.alert.saved': { ru: 'Стиль сохранен в библиотеку', en: 'Style saved to library' },
    'transposer.alert.copied': { ru: 'ДНК стиля скопирован', en: 'DNA Blueprint Copied to Clipboard' },
    'transposer.label.addCutLine': { ru: 'Контур реза', en: 'Add Cut Line' },
    'transposer.label.upscale': { ru: '4K Апскейл', en: '4K Upscale' },
    'transposer.label.poseLock': { ru: 'Сохранить позу', en: 'Pose Lock' },
    'transposer.label.cameraLock': { ru: 'Замок камеры', en: 'Camera Lock' },
    'transposer.label.detailLock': { ru: 'Замок деталей', en: 'Detail Lock' },

    // --- Wizard Modal ---
    'wizard.title': { ru: 'Быстрый стикер', en: 'Quick Sticker' },
    'wizard.step1.title': { ru: 'С чего начнем?', en: 'Where to start?' },
    'wizard.step1.subtitle': { ru: 'Выберите тип вашего будущего стикера', en: 'Choose your sticker type' },
    'wizard.type.image': { ru: 'Иллюстрация', en: 'Illustration' },
    'wizard.type.image.desc': { ru: 'Персонажи, объекты, фоны', en: 'Characters, objects, backgrounds' },
    'wizard.type.text': { ru: 'Текст / Лого', en: 'Typography / Logo' },
    'wizard.type.text.desc': { ru: 'Красивые надписи и стилизованный текст', en: 'Beautiful lettering and styled text' },
    'wizard.textInput.label': { ru: 'Текст для генерации', en: 'Text to generate' },
    'wizard.step2.title': { ru: 'Выберите настроение', en: 'Choose the vibe' },
    'wizard.vibe.fun': { ru: 'Веселый', en: 'Fun' },
    'wizard.vibe.artsy': { ru: 'Арт', en: 'Artsy' },
    'wizard.vibe.tech': { ru: 'Техно', en: 'Tech' },
    'wizard.vibe.weird': { ru: 'Странный', en: 'Weird' },
    'wizard.step3.title': { ru: 'Выберите стиль', en: 'Pick a style' },
    'wizard.finish': { ru: 'Создать', en: 'Forge' },

    // --- Dashboard & Navigation ---
    'hero.title.create': { ru: 'Создавайте магические', en: 'Create Magical' },
    'hero.title.stickers': { ru: 'AI Стикеры', en: 'AI Stickers' },
    'dashboard.cards': { ru: 'Визитки', en: 'Business Cards' },
    'dashboard.print': { ru: 'Печать', en: 'Print Hub' },
    'dashboard.harmony': { ru: 'Фирменный стиль', en: 'Brand Kit' },
    'dashboard.pack': { ru: 'Стикерпак', en: 'Sticker Pack' },
    'dashboard.transposer': { ru: 'Транслятор стиля', en: 'Style Transposer' },
    'dashboard.start': { ru: 'Начать творить', en: 'Start Creating' },
    'dashboard.wizard': { ru: 'Быстрый стикер', en: 'Quick Sticker' },
    'dashboard.upscaler': { ru: 'Апскейлер', en: 'Upscaler' },
    'dashboard.vectorize': { ru: 'Векторизация', en: 'Vectorize' },
    'dashboard.history': { ru: 'История', en: 'History' },
    'dashboard.scanner': { ru: 'Сканер стиля', en: 'Style Scanner' },
    'dashboard.wizard.desc': { ru: 'Создать за 3 шага', en: 'Create in 3 steps' },
    'dashboard.licenseActive': { ru: 'ЛИЦЕНЗИЯ АКТИВНА • {used} / {total} ген', en: 'LICENSE ACTIVE • {used} / {total} gens' },
    'dashboard.adminMode': { ru: '🔧 РЕЖИМ АДМИНА АКТИВЕН', en: '🔧 ADMIN MODE ACTIVE' },

    // --- Panels & Labels ---
    'panel.filters': { ru: 'Фильтры и Тон', en: 'Filters & Tone' },
    'panel.lineWork': { ru: 'Линии и Контур', en: 'Lines & Stroke' },
    'panel.configuration': { ru: 'Конфигурация', en: 'Configuration' },
    'panel.export': { ru: 'Экспорт и Качество', en: 'Export & Quality' },
    'panel.colorTone': { ru: 'Цвет и Тон', en: 'Color & Tone' },
    
    'label.vectorLook': { ru: 'Векторный вид', en: 'Vector Look' },
    'label.outlineOnly': { ru: 'Только контур', en: 'Outline Only' },
    'label.lineWeight': { ru: 'Толщина линий', en: 'Line Weight' },
    'label.mode': { ru: 'Режим', en: 'Mode' },
    'label.shape': { ru: 'Форма', en: 'Shape' },
    'label.model': { ru: 'Модель', en: 'Model' },
    'label.upscale': { ru: '4K Апскейл', en: '4K AI Upscale' },
    'label.transparentBg': { ru: 'Прозрачный фон', en: 'Transparent BG' },
    'label.cutLine': { ru: 'Контур реза', en: 'Add Cut Line' },
    'label.format': { ru: 'Формат', en: 'Format' },
    'label.vectorDetail': { ru: 'Детализация вектора', en: 'Vector Detail' },
    'label.aiPrecision': { ru: 'AI Точность (Кривые)', en: 'AI Precision (Curves)' },
    'label.processing': { ru: 'Обработка', en: 'Processing' },
    'label.optimizeSvg': { ru: 'Оптимизировать слои (SVGO)', en: 'Clean & Group Layers (SVGO)' },
    
    'category.style': { ru: 'Стиль', en: 'Style' },
    'category.background': { ru: 'Фон', en: 'Background' },
    'category.text': { ru: 'Текст', en: 'Text' },
    'category.vfx': { ru: 'Визуальные эффекты', en: 'Visual Effects' },
    'category.filters': { ru: 'Фильтры', en: 'Filters' },
    'category.stroke': { ru: 'Контур', en: 'Stroke' },
    
    // Additional Category Keys for Style Library
    'category.GRAPHICS_AND_DESIGN': { ru: 'Графика и Дизайн', en: 'Graphics & Design' },
    'category.ANIME_AND_CARTOONS': { ru: 'Аниме и Мультфильмы', en: 'Anime & Cartoons' },
    'category.ART_TECHNIQUES': { ru: 'Арт Техники', en: 'Art Techniques' },
    'category.TECHNO_AND_FUTURISM': { ru: 'Техно и Футуризм', en: 'Techno & Futurism' },
    'category.ABSTRACTION_AND_PSYCHEDELIA': { ru: 'Абстракция и Психоделика', en: 'Abstraction & Psychedelia' },
    'category.ARCHITECTURE_AND_MINIMALISM': { ru: 'Архитектура и Минимализм', en: 'Architecture & Minimalism' },

    'option.standard': { ru: 'Стандарт', en: 'Standard' },
    'option.high': { ru: 'Высокая', en: 'High' },
    'option.smooth': { ru: 'Сглаженная', en: 'Smooth' },
    'option.fast': { ru: 'Flash ⚡', en: 'Flash ⚡' },
    'option.pro': { ru: 'Pro ✨', en: 'Pro ✨' },
    'option.single': { ru: 'Одиночный', en: 'Single' },
    'option.batch': { ru: 'Пакетный', en: 'Batch' },
    'option.isolation': { ru: 'Изоляция', en: 'Isolation' },
    'option.container': { ru: 'Контейнер', en: 'Container' },
    'option.circle': { ru: 'Круг', en: 'Circle' },
    'option.square': { ru: 'Квадрат', en: 'Square' },
    'option.triangle': { ru: 'Треугольник', en: 'Triangle' },
    'option.thin': { ru: 'Тонкий', en: 'Thin' },
    'option.medium': { ru: 'Средний', en: 'Medium' },
    'option.thick': { ru: 'Толстый', en: 'Thick' },

    'format.stickerType': { ru: 'Тип стикера', en: 'Sticker Type' },
    'format.stickerType.image': { ru: 'Изображение', en: 'Image' },
    'format.stickerType.text': { ru: 'Текст', en: 'Text' },
    'format.stickerMode': { ru: 'Режим стикера', en: 'Sticker Mode' },
    'format.stickerMode.isolation': { ru: 'Изоляция', en: 'Isolation' },
    'format.stickerMode.container': { ru: 'Контейнер', en: 'Container' },
    'format.stickerMode.fullImage': { ru: 'Холст', en: 'Canvas' },
    'format.containerShape': { ru: 'Форма контейнера', en: 'Container Shape' },
    'format.containerShape.circle': { ru: 'Круг', en: 'Circle' },
    'format.containerShape.square': { ru: 'Квадрат', en: 'Square' },
    'format.containerShape.triangle': { ru: 'Треугольник', en: 'Triangle' },
    'format.containerShape.octahedron': { ru: 'Восьмиугольник', en: 'Octagon' },
    'format.dynamicFrameInfo': { ru: 'Динамическая рамка', en: 'Dynamic Frame' },
    'format.compositionLock': { ru: 'Блокировка композиции', en: 'Composition Lock' },
    'format.compositionLock.pose': { ru: 'Поза', en: 'Pose' },
    'format.compositionLock.camera': { ru: 'Камера', en: 'Camera' },

    'quality.generation': { ru: 'Качество генерации', en: 'Generation Quality' },
    'quality.generation.standard': { ru: 'Стандарт', en: 'Standard' },
    'quality.generation.premium': { ru: 'Премиум', en: 'Premium' },
    'quality.generation.ultra': { ru: 'Ультра', en: 'Ultra' },
    'quality.generation.master': { ru: 'Мастер', en: 'Master' },
    'quality.renderStyle': { ru: 'Стиль рендера', en: 'Render Style' },
    'quality.renderStyle.vector': { ru: 'Вектор', en: 'Vector' },
    'quality.renderStyle.outlineOnly': { ru: 'Только контур', en: 'Outline Only' },
    'quality.lineWeight': { ru: 'Толщина линий', en: 'Line Weight' },
    'quality.lineWeight.thin': { ru: 'Тонкая', en: 'Thin' },
    'quality.lineWeight.medium': { ru: 'Средняя', en: 'Medium' },
    'quality.lineWeight.thick': { ru: 'Толстая', en: 'Thick' },
    'quality.detailPreservation': { ru: 'Детализация', en: 'Detail Preservation' },
    'quality.detailPreservation.lock': { ru: 'Сохранить детали', en: 'Lock Details' },

    'background.isolationInfo': { ru: 'Информация об изоляции', en: 'Isolation Info' },
    'background.styleBackground': { ru: 'Стиль фона', en: 'Style Background' },
    'background.lockBackground': { ru: 'Блокировка фона', en: 'Lock Background' },
    'background.disabled.lock': { ru: 'Блокировка недоступна', en: 'Lock Disabled' },

    'text.title': { ru: 'Настройки текста', en: 'Text Settings' },
    'text.mode.noText': { ru: 'Без текста', en: 'No Text' },
    'text.mode.customText': { ru: 'Свой текст', en: 'Custom Text' },
    'text.placeholder': { ru: 'Введите текст', en: 'Enter text' },
    'text.color': { ru: 'Цвет', en: 'Color' },
    'text.color.custom': { ru: 'Свой цвет', en: 'Custom Color' },
    'text.color.random': { ru: 'Случайный', en: 'Random' },
    'text.shape': { ru: 'Форма текста', en: 'Text Shape' },
    'text.shape.straight': { ru: 'Прямой', en: 'Straight' },
    'text.shape.archUp': { ru: 'Дугой вверх', en: 'Arch Up' },
    'text.shape.archDown': { ru: 'Дугой вниз', en: 'Arch Down' },
    'text.shape.circular': { ru: 'Круговой', en: 'Circular' },
    'text.size': { ru: 'Размер', en: 'Size' },
    'text.size.small': { ru: 'Маленький', en: 'Small' },
    'text.size.medium': { ru: 'Средний', en: 'Medium' },
    'text.size.large': { ru: 'Большой', en: 'Large' },
    'text.sizeAndPosition': { ru: 'Размер и позиция', en: 'Size & Position' },
    'text.position.top': { ru: 'Сверху', en: 'Top' },
    'text.position.bottom': { ru: 'Снизу', en: 'Bottom' },
    'text.position.integrated': { ru: 'Внутри', en: 'Integrated' },
    'text.position.around': { ru: 'Вокруг', en: 'Around' },
    'text.stabilityTip.title': { ru: 'Совет', en: 'Tip' },
    'text.stabilityTip.content': { ru: 'Для лучшего результата...', en: 'For better results...' },
    'text.stabilityTip.action1': { ru: 'Действие 1', en: 'Action 1' },
    'text.stabilityTip.action2': { ru: 'Действие 2', en: 'Action 2' },
    'text.stabilityTip.action3': { ru: 'Действие 3', en: 'Action 3' },

    'vfx.title': { ru: 'Эффекты', en: 'VFX' },
    'vfx.materialTexture': { ru: 'Материал', en: 'Material' },
    'vfx.material.standard': { ru: 'Стандарт', en: 'Standard' },
    'vfx.material.wet': { ru: 'Мокрый', en: 'Wet' },
    'vfx.material.glossy': { ru: 'Глянцевый', en: 'Glossy' },
    'vfx.material.metallic': { ru: 'Металлик', en: 'Metallic' },
    'vfx.material.glass': { ru: 'Стекло', en: 'Glass' },
    'vfx.lighting': { ru: 'Освещение', en: 'Lighting' },
    'vfx.lighting.standard': { ru: 'Стандарт', en: 'Standard' },
    'vfx.lighting.rim': { ru: 'Контурное', en: 'Rim' },
    'vfx.lighting.studio': { ru: 'Студийное', en: 'Studio' },
    'vfx.lighting.dramatic': { ru: 'Драматичное', en: 'Dramatic' },
    'vfx.lighting.cinematic': { ru: 'Кинематографичное', en: 'Cinematic' },
    'vfx.sss.label': { ru: 'SSS', en: 'SSS' },
    'vfx.sss.tooltip': { ru: 'Подповерхностное рассеивание', en: 'Subsurface Scattering' },
    'vfx.particleEffects': { ru: 'Частицы', en: 'Particles' },
    'vfx.particles.none': { ru: 'Нет', en: 'None' },
    'vfx.particles.droplets': { ru: 'Капли', en: 'Droplets' },
    'vfx.particles.mist': { ru: 'Туман', en: 'Mist' },
    'vfx.particles.sparkles': { ru: 'Искры', en: 'Sparkles' },
    'vfx.particles.glow': { ru: 'Свечение', en: 'Glow' },
    'vfx.colorVibrance': { ru: 'Насыщенность', en: 'Vibrance' },
    'vfx.lockedByStyle': { ru: 'Заблокировано стилем', en: 'Locked by style' },
    'vfx.disabled.outlineOnly': { ru: 'Отключено (только контур)', en: 'Disabled (outline only)' },
    'vfx.disabled.configError': { ru: 'Ошибка конфигурации', en: 'Config Error' },

    'advanced.modelTier': { ru: 'Уровень модели', en: 'Model Tier' },
    'advanced.aspectRatio': { ru: 'Соотношение сторон', en: 'Aspect Ratio' },
    'advanced.negativePrompt': { ru: 'Отрицательный промпт', en: 'Negative Prompt' },
    'advanced.negativePrompt.placeholder': { ru: 'Что исключить...', en: 'What to exclude...' },

    'style.search': { ru: 'Поиск стиля...', en: 'Search style...' },
    'style.tip.title': { ru: 'Совет', en: 'Tip' },
    'style.userStyles': { ru: '🧬 Мои стили (Приватные)', en: '🧬 My Styles (Private)' },
    'style.notFound.title': { ru: 'Ничего не найдено', en: 'Nothing found' },
    'style.strict': { ru: 'Строгий', en: 'Strict' },
    'style.artistic': { ru: 'Художественный', en: 'Artistic' },
    'style.artisticRecommended': { ru: 'Рекомендуется для сложных изображений', en: 'Recommended for complex images' },

    // --- Style Names ---
    'style.technical_vector.name': { ru: 'Технический Вектор', en: 'Technical Vector' },
    'style.technical_vector.badge': { ru: 'Строгий', en: 'Strict' },
    'style.80s_cartoon.name': { ru: 'Мультфильм 80-х', en: '80s Cartoon' },
    'style.80s_cartoon.badge': { ru: 'Ретро', en: 'Retro' },
    'style.pop_art.name': { ru: 'Поп-Арт', en: 'Pop Art' },
    'style.pop_art.badge': { ru: 'Арт', en: 'Art' },
    'style.neo_pop.name': { ru: 'Нео-Поп', en: 'Neo Pop' },
    'style.neo_pop.badge': { ru: 'Арт', en: 'Art' },
    'style.vibrant_digital_comic.name': { ru: 'Яркий Комикс', en: 'Vibrant Comic' },
    'style.vibrant_digital_comic.badge': { ru: 'Строгий', en: 'Strict' },
    'style.sunset_vector_noir.name': { ru: 'Закатный Вектор', en: 'Sunset Vector' },
    'style.sunset_vector_noir.badge': { ru: 'Арт', en: 'Art' },
    'style.kawaii.name': { ru: 'Каваи', en: 'Kawaii' },
    'style.kawaii.badge': { ru: 'Аниме', en: 'Anime' },
    'style.child_drawing.name': { ru: 'Детский Рисунок', en: 'Child Drawing' },
    'style.child_drawing.badge': { ru: 'Арт', en: 'Art' },
    'style.graphite_sketch.name': { ru: 'Графитный Скетч', en: 'Graphite Sketch' },
    'style.graphite_sketch.badge': { ru: 'Арт', en: 'Art' },
    'style.woodcut.name': { ru: 'Гравюра', en: 'Woodcut' },
    'style.woodcut.badge': { ru: 'Арт', en: 'Art' },
    'style.embroidery.name': { ru: 'Вышивка', en: 'Embroidery' },
    'style.embroidery.badge': { ru: 'Арт', en: 'Art' },
    'style.knitted_diorama_art.name': { ru: 'Вязаная Диорама', en: 'Knitted Diorama' },
    'style.knitted_diorama_art.badge': { ru: 'Арт', en: 'Art' },
    'style.watercolor_nature.name': { ru: 'Акварель', en: 'Watercolor' },
    'style.watercolor_nature.badge': { ru: 'Арт', en: 'Art' },
    'style.paper_cut.name': { ru: 'Бумажный Вырез', en: 'Paper Cut' },
    'style.paper_cut.badge': { ru: 'Арт', en: 'Art' },
    'style.paper_cut_art.name': { ru: 'Бумажный Арт', en: 'Paper Art' },
    'style.paper_cut_art.badge': { ru: 'Арт', en: 'Art' },
    'style.scratchboard_poster.name': { ru: 'Граттаж', en: 'Scratchboard' },
    'style.scratchboard_poster.badge': { ru: 'Арт', en: 'Art' },
    'style.lyrical_graphic.name': { ru: 'Лирическая Графика', en: 'Lyrical Graphic' },
    'style.lyrical_graphic.badge': { ru: 'Арт', en: 'Art' },
    'style.botanical_illustration.name': { ru: 'Ботаническая Иллюстрация', en: 'Botanical' },
    'style.botanical_illustration.badge': { ru: 'Арт', en: 'Art' },
    'style.cyberpunk.name': { ru: 'Киберпанк', en: 'Cyberpunk' },
    'style.cyberpunk.badge': { ru: 'Арт', en: 'Art' },
    'style.steampunk.name': { ru: 'Стимпанк', en: 'Steampunk' },
    'style.steampunk.badge': { ru: 'Арт', en: 'Art' },
    'style.neon_cosmic_cgi.name': { ru: 'Неоновый Космос', en: 'Neon Cosmic' },
    'style.neon_cosmic_cgi.badge': { ru: 'Арт', en: 'Art' },
    'style.liquid.name': { ru: 'Жидкость', en: 'Liquid' },
    'style.liquid.badge': { ru: 'Арт', en: 'Art' },
    'style.ufo_psychedelic.name': { ru: 'НЛО Психоделика', en: 'UFO Psychedelic' },
    'style.ufo_psychedelic.badge': { ru: 'Арт', en: 'Art' },
    'style.art_deco.name': { ru: 'Арт-Деко', en: 'Art Deco' },
    'style.art_deco.badge': { ru: 'Арт', en: 'Art' },
    'style.brutalism.name': { ru: 'Брутализм', en: 'Brutalism' },
    'style.brutalism.badge': { ru: 'Арт', en: 'Art' },
    'style.scandinavian.name': { ru: 'Скандинавский', en: 'Scandinavian' },
    'style.scandinavian.badge': { ru: 'Арт', en: 'Art' },
    'style.stained_glass.name': { ru: 'Витраж', en: 'Stained Glass' },
    'style.stained_glass.badge': { ru: 'Арт', en: 'Art' },
    'style.custom.name': { ru: 'Пользовательский', en: 'Custom' },
    'style.custom.badge': { ru: 'Свой', en: 'Custom' },

    // --- Generator Specific ---
    'generator.title': { ru: 'Конструктор стикеров', en: 'Sticker Generator' },
    'generator.processing': { ru: 'Генерация...', en: 'Generating...' },
    'generator.button': { ru: 'Генерировать', en: 'Generate' },
    'generator.stop': { ru: 'Остановить', en: 'Stop' },
    'generator.seed.label': { ru: 'Сид', en: 'Seed' },
    'generator.reference.label': { ru: 'Референс', en: 'Reference' },
    'generator.reference.clear': { ru: 'Очистить', en: 'Clear' },
    'generator.batch.label': { ru: 'Список эмоций', en: 'Emotions List' },
    'generator.batch.empty': { ru: 'Нет результатов', en: 'No results' },
    'state.emptyCanvas': { ru: 'Ваш шедевр появится здесь', en: 'Your masterpiece will appear here' },
    'pack.defaultEmotions': { ru: "Счастье, Грусть, Злость, Удивление, Крутость, Задумчивость", en: "Happy, Sad, Angry, Surprised, Cool, Thinking" },

    // --- Processor Specific ---
    'processor.title': { ru: 'Векторизация', en: 'Vectorization' },
    'processor.subtitle': { ru: 'Преобразование растра в идеальный SVG', en: 'Convert raster to perfect SVG' },
    'processor.status.generating': { ru: 'Генерация ЧБ...', en: 'Generating B&W...' },
    'processor.status.tracing': { ru: 'Трассировка...', en: 'Tracing paths...' },
    'processor.analysisHint': { ru: 'Использует Gemini 3 Pro для анализа структуры краев.', en: 'Uses Gemini 3 Pro for edge structural analysis.' },
    'processor.uploadLabel': { ru: 'Загрузить изображение', en: 'Upload Image' },
    'processor.action.generate': { ru: 'Генерация', en: 'Generate' },
    'processor.action.vectorize': { ru: 'Векторизовать', en: 'Vectorize' },
    'processor.error': { ru: 'Ошибка обработки', en: 'Processing error' },
    
    // --- Forge UI ---
    'forge.title': { ru: 'Style Forge', en: 'Style Forge' },
    'forge.subtitle': { ru: 'Developer Batch Lab', en: 'Developer Batch Lab' },
    'forge.masterPrompt': { ru: 'Мастер-промпт', en: 'Master Prompt' },
    'forge.run': { ru: 'Запустить', en: 'Run' },
    'forge.idle': { ru: 'Ожидание', en: 'Forge Idle' },
    'forge.downloadZip': { ru: 'Скачать архив', en: 'Download Archive' },
    'forge.masterSheet': { ru: 'Лист для печати', en: 'Master Sheet' },
    'forge.anchors': { ru: 'Якоря', en: 'Anchors' },

    // --- Sticker Pack UI (Expanded) ---
    'pack.title': { ru: 'Стикерпак', en: 'Sticker Pack' },
    'pack.subtitle': { ru: 'Создайте набор стикеров в одном стиле', en: 'Create a sticker set in one style' },
    'pack.references': { ru: 'Референсы (до 10)', en: 'References (up to 10)' },
    'pack.info.multiRef': { ru: 'Загрузите до 10 изображений для точного сохранения персонажа', en: 'Upload up to 10 images for precise character consistency' },
    'pack.action.layout': { ru: 'Верстка печати', en: 'Print Layout' },
    'pack.presets.title': { ru: 'ПРЕСЕТЫ', en: 'PRESETS' },
    'pack.slots': { ru: 'АКТИВНЫЕ СЛОТЫ', en: 'ACTIVE SLOTS' },
    'pack.clear': { ru: 'Очистить', en: 'Clear' },
    'pack.empty_hint': { ru: 'Выберите пресеты или добавьте свои', en: 'Select presets or add custom emotions' },
    'pack.text_placement': { ru: 'Положение текста', en: 'Text Placement' },
    'pack.pos_bottom': { ru: 'Снизу', en: 'Bottom' },
    'pack.pos_top': { ru: 'Сверху', en: 'Top' },
    'pack.pos_integrated': { ru: 'Внутри (Арт)', en: 'In Art' },
    'pack.anchor.label': { ru: 'Стилевой Якорь (Опционально)', en: 'Style Anchor (Optional)' },
    'pack.anchor.upload': { ru: 'Загрузить прошлый стикер', en: 'Upload Previous Sticker' },

    // --- Print Master ---
    'print.interactive.title': { ru: 'Интерактивная Печать', en: 'Interactive Print' },
    'print.setup.title': { ru: 'Настройки Листа', en: 'Sheet Setup' },
    'print.action.add': { ru: 'Добавить фото', en: 'Add Photo' },
    'print.action.bgGen': { ru: 'Генерация Фона', en: 'Generate BG' },
    'print.status.bgGen': { ru: 'Генерация...', en: 'Generating...' },
    'print.tools.duplicate': { ru: 'Дублировать', en: 'Duplicate' },
    'print.tools.delete': { ru: 'Удалить', en: 'Delete' },
    'print.action.clear': { ru: 'Очистить лист', en: 'Clear Sheet' },
    'print.paper.a4': { ru: 'A4 • 300 DPI • CMYK Ready', en: 'A4 • 300 DPI • CMYK Ready' },
    'print.action.export': { ru: 'Экспорт в печать', en: 'Export for Print' },

    // --- Harmony ---
    'harmony.title': { ru: 'Бренд Кит', en: 'Brand Kit' },
    'harmony.subtitle': { ru: 'Генерация айдентики', en: 'Identity Generation' },
    'harmony.status.logo': { ru: 'Генерация лого...', en: 'Generating logo...' },
    'harmony.status.pattern': { ru: 'Создание паттерна...', en: 'Creating pattern...' },
    'harmony.status.social': { ru: 'Аватар соцсетей...', en: 'Social avatar...' },
    'harmony.status.banner': { ru: 'Баннер сайта...', en: 'Web banner...' },
    'harmony.asset.logo': { ru: 'Логотип', en: 'Logo' },
    'harmony.asset.pattern': { ru: 'Паттерн', en: 'Pattern' },
    'harmony.asset.social': { ru: 'Соцсети', en: 'Social' },
    'harmony.asset.banner': { ru: 'Баннер', en: 'Banner' },
    'harmony.action.generate': { ru: 'Создать стиль', en: 'Forge Identity' },
    'harmony.action.downloadAll': { ru: 'Скачать всё', en: 'Download All' },

    // --- Card ---
    'card.generator.title': { ru: 'Конструктор Визиток', en: 'Card Generator' },
    'card.category.branding': { ru: 'Брендинг', en: 'Branding' },
    'card.brand.hub': { ru: 'Brand Hub', en: 'Brand Hub' },
    'card.brand.load': { ru: 'Загрузить бренд...', en: 'Load brand...' },
    'card.brand.empty': { ru: 'Нет сохраненных брендов', en: 'No saved brands' },
    'card.brand.save': { ru: 'Сохранить текущий', en: 'Save Current' },
    'card.action.visionScan': { ru: 'Vision Scan (из фото)', en: 'Vision Scan (from photo)' },
    'card.field.company': { ru: 'Компания', en: 'Company' },
    'card.field.accent': { ru: 'Акцент', en: 'Accent' },
    'card.field.description': { ru: 'О компании', en: 'About Company' },
    'card.field.logo': { ru: 'Логотип', en: 'Logo' },
    'card.action.generateLogo': { ru: 'Создать', en: 'Create' },
    'card.category.employee': { ru: 'Сотрудник', en: 'Employee' },
    'card.batch.import': { ru: 'Импорт CSV', en: 'Import CSV' },
    'card.batch.count': { ru: 'Записей: {count}', en: 'Entries: {count}' },
    'card.field.name': { ru: 'Имя', en: 'Name' },
    'card.field.position': { ru: 'Должность', en: 'Position' },
    'card.field.phone': { ru: 'Телефон', en: 'Phone' },
    'card.field.email': { ru: 'Email', en: 'Email' },
    'card.field.website': { ru: 'Сайт', en: 'Website' },
    'card.field.address': { ru: 'Адрес', en: 'Address' },
    'card.field.telegram': { ru: 'Telegram', en: 'Telegram' },
    'card.field.instagram': { ru: 'Instagram', en: 'Instagram' },
    'card.field.whatsapp': { ru: 'WhatsApp', en: 'WhatsApp' },
    'card.category.visual': { ru: 'Визуал', en: 'Visual' },
    'card.style.swiss.name': { ru: 'Швейцарский', en: 'Swiss' },
    'card.style.luxury.name': { ru: 'Люкс', en: 'Luxury' },
    'card.style.tech.name': { ru: 'Техно', en: 'Tech' },
    'card.style.eco.name': { ru: 'Эко', en: 'Eco' },
    'card.field.contrast': { ru: 'Белый текст', en: 'White Text' },
    'card.action.colorSuite': { ru: 'Генерация палитры', en: 'Generate Suite' },
    'card.category.layout': { ru: 'Макет', en: 'Layout' },
    'card.layout.classic': { ru: 'Классика', en: 'Classic' },
    'card.layout.center': { ru: 'Центр', en: 'Center' },
    'card.layout.vertical': { ru: 'Вертикаль', en: 'Vertical' },
    'card.field.font': { ru: 'Шрифт', en: 'Font' },
    'card.toggle.backside': { ru: 'Оборотная сторона', en: 'Back Side' },
    'card.toggle.logo': { ru: 'Логотип', en: 'Logo' },
    'card.toggle.qr': { ru: 'QR Код', en: 'QR Code' },
    'card.toggle.social': { ru: 'Соцсети', en: 'Social' },
    'card.toggle.decor': { ru: 'Декор', en: 'Decor' },
    'card.field.qrMode': { ru: 'Режим QR', en: 'QR Mode' },
    'card.qrMode.vcard': { ru: 'vCard (Контакт)', en: 'vCard (Contact)' },
    'card.qrMode.link': { ru: 'Ссылка', en: 'Link' },
    'card.offset.title': { ru: 'Точная настройка', en: 'Precision' },
    'card.action.resetLayout': { ru: 'Сброс', en: 'Reset' },
    'card.action.alignCenter': { ru: 'Центр', en: 'Center' },
    'card.offset.textScale': { ru: 'Масштаб текста', en: 'Text Scale' },
    'card.offset.letterSpacing': { ru: 'Межбуквенный', en: 'Letter Spacing' },
    'card.offset.logoScale': { ru: 'Размер лого', en: 'Logo Size' },
    'card.offset.qrScale': { ru: 'Размер QR', en: 'QR Size' },
    'card.side.front': { ru: 'Лицо', en: 'Front' },
    'card.side.back': { ru: 'Оборот', en: 'Back' },
    'card.toggle.mockup': { ru: 'Мокап', en: 'Mockup' },
    'card.labels.bleed': { ru: 'Вылет', en: 'Bleed' },
    'card.labels.safeZone': { ru: 'Безопасная зона', en: 'Safe Zone' },
    'card.status.scanning': { ru: 'Анализ визитки...', en: 'Analyzing card...' },
    'card.vision.success': { ru: 'Данные извлечены!', en: 'Data Extracted!' },
    'card.status.logo': { ru: 'Создание лого...', en: 'Creating logo...' },
    'card.batch.processing': { ru: 'Обработка партии...', en: 'Processing batch...' },
    'card.action.downloadBatchZip': { ru: 'Скачать партию (ZIP)', en: 'Download Batch (ZIP)' },
    'card.action.downloadAll': { ru: 'Скачать всё', en: 'Download All' },

    // --- Upscaler ---
    'upscaler.title': { ru: 'AI Апскейлер', en: 'AI Upscaler' },
    'upscaler.subtitle': { ru: 'Локальное увеличение x4', en: 'Local x4 Enhancement' },
    'upscaler.original': { ru: 'Оригинал', en: 'Original' },
    'upscaler.result': { ru: 'Результат', en: 'Result' },
    'upscaler.uploadLabel': { ru: 'Загрузить фото', en: 'Upload Photo' },
    'upscaler.placeholder': { ru: 'JPG, PNG до 5MB', en: 'JPG, PNG up to 5MB' },
    'upscaler.processing': { ru: 'Улучшение качества...', en: 'Enhancing quality...' },
    'upscaler.process': { ru: 'Улучшить', en: 'Enhance' },
    'upscaler.compareTip': { ru: 'Результат может отличаться в зависимости от исходного качества', en: 'Result depends on source quality' },
    'upscaler.download': { ru: 'Скачать HD', en: 'Download HD' },
    'upscaler.error': { ru: 'Ошибка апскейла', en: 'Upscale error' },

    // --- EXTENDED GUIDE (INSTRUCTIONS) ---
    'instructions.title': { ru: 'Руководство StiGenAi', en: 'StiGenAi Guidebook' },
    'instructions.close': { ru: 'Закрыть', en: 'Close' },
    
    // Guide Menus
    'guide.menu.welcome': { ru: 'Введение', en: 'Welcome' },
    'guide.menu.generator': { ru: 'Генератор Стикеров', en: 'Sticker Generator' },
    'guide.menu.pack': { ru: 'Стикерпаки', en: 'Sticker Packs' },
    'guide.menu.cards': { ru: 'Визитки', en: 'Business Cards' },
    'guide.menu.transposer': { ru: 'Style Transposer', en: 'Style Transposer' },
    'guide.menu.upscaler': { ru: 'Апскейлер', en: 'Upscaler' },
    'guide.menu.vector': { ru: 'Векторизация', en: 'Vectorization' },
    'guide.menu.print': { ru: 'Центр Печати', en: 'Print Hub' },
    'guide.menu.harmony': { ru: 'Бренд Кит', en: 'Brand Kit' },

    // Guide Content
    'guide.section.welcome.title': { ru: 'Добро пожаловать в StiGenAi', en: 'Welcome to StiGenAi' },
    'guide.section.welcome.text': { 
        ru: `StiGenAi — это профессиональный комбайн для создания графики с помощью ИИ. Мы объединили лучшие нейросети (Gemini 3 Pro) с инструментами обработки изображений для создания стикеров, визиток, векторов и брендинга.<br/><br/>
        <b>Ключевые возможности:</b>
        <ul style="list-style-type: disc; padding-left: 20px;">
            <li><b>AI Генерация:</b> Создание уникальных стикеров по текстовому описанию.</li>
            <li><b>Стикерпаки:</b> Создание наборов стикеров с сохранением персонажа.</li>
            <li><b>Style Transposer:</b> Копирование стиля с любого изображения.</li>
            <li><b>Бизнес-инструменты:</b> Визитки, логотипы и айдентика.</li>
            <li><b>Постобработка:</b> Векторизация (SVG), Апскейл (x4), Подготовка к печати.</li>
        </ul>`,
        en: `StiGenAi is a professional AI-powered graphics suite. We combine top-tier neural networks (Gemini 3 Pro) with image processing tools to create stickers, business cards, vectors, and branding assets.<br/><br/>
        <b>Key Features:</b>
        <ul style="list-style-type: disc; padding-left: 20px;">
            <li><b>AI Generation:</b> Create unique stickers from text prompts.</li>
            <li><b>Sticker Packs:</b> Create sets with consistent characters.</li>
            <li><b>Style Transposer:</b> Copy style from any reference image.</li>
            <li><b>Business Tools:</b> Business cards, logos, and identity.</li>
            <li><b>Post-processing:</b> Vectorization (SVG), Upscale (x4), Print Prep.</li>
        </ul>`
    },

    'guide.section.generator.title': { ru: 'Генератор Стикеров', en: 'Sticker Generator' },
    'guide.section.generator.text': {
        ru: `Основной инструмент для создания одиночных стикеров.<br/><br/>
        <b>Режимы:</b>
        <ul>
            <li><b>Flash ⚡ (Nano Banana):</b> Быстрая модель, идеально для простых стикеров. Бесплатно.</li>
            <li><b>Pro ✨ (Gemini 3 Pro):</b> Высокая детализация, точное следование сложным промптам. Требует ваш API ключ.</li>
        </ul>
        <br/>
        <b>Инструменты контроля:</b>
        <ul>
            <li><b>Reference Image (Референс):</b> Загрузите фото, чтобы нейросеть использовала его структуру.</li>
            <li><b>Locks (Замки):</b>
                <ul>
                    <li>🔒 <b>Pose Lock:</b> Сохраняет позу персонажа с референса.</li>
                    <li>🔒 <b>Camera Lock:</b> Сохраняет ракурс камеры.</li>
                    <li>🔒 <b>Detail Lock:</b> Пытается сохранить мелкие детали (одежда, аксессуары).</li>
                </ul>
            </li>
            <li><b>Batch Mode:</b> Введите список эмоций (каждая с новой строки), чтобы сгенерировать серию вариаций за один раз.</li>
        </ul>`,
        en: `The core tool for creating single stickers.<br/><br/>
        <b>Modes:</b>
        <ul>
            <li><b>Flash ⚡ (Nano Banana):</b> Fast model, great for simple stickers. Free.</li>
            <li><b>Pro ✨ (Gemini 3 Pro):</b> High detail, precise prompt adherence. Requires your API key.</li>
        </ul>
        <br/>
        <b>Control Tools:</b>
        <ul>
            <li><b>Reference Image:</b> Upload a photo to guide the structure.</li>
            <li><b>Locks:</b>
                <ul>
                    <li>🔒 <b>Pose Lock:</b> Keeps the character's pose.</li>
                    <li>🔒 <b>Camera Lock:</b> Keeps the camera angle.</li>
                    <li>🔒 <b>Detail Lock:</b> Tries to preserve fine details.</li>
                </ul>
            </li>
            <li><b>Batch Mode:</b> Enter a list of emotions (one per line) to generate multiple variations at once.</li>
        </ul>`
    },

    'guide.section.pack.title': { ru: 'Стикерпаки', en: 'Sticker Packs' },
    'guide.section.pack.text': {
        ru: `Инструмент для создания наборов из 5 стикеров с одним персонажем.<br/><br/>
        <b>Как это работает (Магия Якорей):</b><br/>
        1. <b>Референсы:</b> Загрузите фото вашего персонажа (до 10 шт) для максимальной схожести.<br/>
        2. <b>Якорь (Anchor):</b> Система генерирует первый стикер и использует его как "якорь" стиля для всех последующих. Это гарантирует, что все стикеры в паке будут выглядеть единообразно.<br/>
        3. <b>Эмоции:</b> Выберите готовые пресеты эмоций или напишите свои.<br/>
        4. <b>Результат:</b> Скачайте результат архивом или отправьте сразу на лист печати (Print Hub).`,
        en: `Tool for creating 5-sticker sets with a single character.<br/><br/>
        <b>How it works (Anchor Magic):</b><br/>
        1. <b>References:</b> Upload reference photos of your character (up to 10) for max consistency.<br/>
        2. <b>Anchor:</b> The system generates the first sticker and uses it as a "style anchor" for the rest. This ensures all stickers in the pack look consistent.<br/>
        3. <b>Emotions:</b> Select presets or type your own.<br/>
        4. <b>Result:</b> Download as ZIP or send directly to Print Hub.`
    },

    'guide.section.cards.title': { ru: 'Генератор Визиток', en: 'Business Card Generator' },
    'guide.section.cards.text': {
        ru: `Создание профессиональных макетов визиток с учетом типографских требований.<br/><br/>
        <b>Функции:</b>
        <ul>
            <li><b>Vision Scan 👁️:</b> Загрузите фото старой визитки или скриншот сайта. ИИ распознает контакты, название и описание компании и заполнит поля за вас.</li>
            <li><b>Стили:</b> 4 премиум-стиля (Swiss, Luxury, Tech, Eco).</li>
            <li><b>Batch CSV:</b> Загрузите список сотрудников (файл .csv) и сгенерируйте визитки для всей команды одним кликом.</li>
            <li><b>Печать:</b> Экспорт в высоком разрешении (300 DPI) с учетом вылетов под обрез (bleeds).</li>
        </ul>`,
        en: `Create professional business card layouts ready for print.<br/><br/>
        <b>Features:</b>
        <ul>
            <li><b>Vision Scan 👁️:</b> Upload a photo of an old card or website screenshot. AI extracts contacts and brand info automatically.</li>
            <li><b>Styles:</b> 4 premium styles (Swiss, Luxury, Tech, Eco).</li>
            <li><b>Batch CSV:</b> Upload employee list (.csv) and generate cards for the whole team in one click.</li>
            <li><b>Print:</b> Export in high resolution (300 DPI) with bleed areas included.</li>
        </ul>`
    },

    'guide.section.transposer.title': { ru: 'Style Transposer (ДНК Стиля)', en: 'Style Transposer' },
    'guide.section.transposer.text': {
        ru: `Уникальная технология переноса стиля.<br/><br/>
        <b>Процесс:</b>
        <ol>
            <li><b>Анализ:</b> Загрузите референсы (картинки с желаемым стилем). ИИ извлечет "ДНК" стиля: палитру, технику штриха, освещение, композицию.</li>
            <li><b>Цель:</b> Загрузите фото объекта, который нужно стилизовать.</li>
            <li><b>Синтез (The Forge):</b> Система создает новое изображение, накладывая ДНК стиля на ваш объект с сохранением его геометрии.</li>
        </ol>
        Полезно для создания аватарок в стиле любимых мультфильмов или игр.`,
        en: `Unique style transfer technology.<br/><br/>
        <b>Process:</b>
        <ol>
            <li><b>Analysis:</b> Upload references (images with desired style). AI extracts the style "DNA": palette, strokes, lighting, composition.</li>
            <li><b>Target:</b> Upload the target object photo.</li>
            <li><b>Synthesis (The Forge):</b> The system creates a new image by mapping the style DNA onto your object while preserving its geometry.</li>
        </ol>
        Great for creating avatars in the style of favorite cartoons or games.`
    },

    'guide.section.upscale.title': { ru: 'AI Апскейлер', en: 'AI Upscaler' },
    'guide.section.upscale.text': {
        ru: `Локальное увеличение разрешения в 4 раза без потери качества.<br/><br/>
        Использует нейросеть Real-ESRGAN прямо в браузере (через WebGL). Ваши данные не покидают устройство при апскейле. Идеально для подготовки изображений к печати, если исходник низкого качества.`,
        en: `Local 4x resolution upscale without quality loss.<br/><br/>
        Uses Real-ESRGAN neural net right in your browser (via WebGL). Data stays on device during upscale. Perfect for preparing low-res images for print.`
    },

    'guide.section.vector.title': { ru: 'Векторизация (SVG)', en: 'Vectorization (SVG)' },
    'guide.section.vector.text': {
        ru: `Превращает растровые картинки (PNG/JPG) в векторные (SVG).<br/><br/>
        <b>Технологии:</b>
        <ul>
            <li><b>VTracer (WASM):</b> Быстрый и точный движок трассировки.</li>
            <li><b>AI Analysis:</b> Gemini Vision анализирует структуру изображения перед трассировкой, чтобы подобрать идеальные параметры (сглаживание, количество цветов).</li>
        </ul>
        Результат — чистый SVG файл, готовый для плоттерной резки или редактирования в Adobe Illustrator.`,
        en: `Converts raster images (PNG/JPG) to vector (SVG).<br/><br/>
        <b>Technologies:</b>
        <ul>
            <li><b>VTracer (WASM):</b> Fast and accurate tracing engine.</li>
            <li><b>AI Analysis:</b> Gemini Vision analyzes image structure before tracing to pick optimal parameters (smoothing, color count).</li>
        </ul>
        Result is a clean SVG file, ready for plotter cutting or editing in Adobe Illustrator.`
    },

    'guide.section.print.title': { ru: 'Центр Печати (Print Hub)', en: 'Print Hub' },
    'guide.section.print.text': {
        ru: `Интерактивная верстка листа А4 для домашней печати.<br/>
        <ul>
            <li>Перетаскивайте готовые стикеры и визитки на лист.</li>
            <li>Дублируйте элементы для заполнения листа.</li>
            <li>Генерируйте красивые фоны для листа с помощью AI.</li>
            <li><b>Экспорт:</b> Скачивание в полном разрешении 300 DPI (PNG), готовое для отправки в типографию или на принтер.</li>
        </ul>`,
        en: `Interactive A4 sheet layout for home printing.<br/>
        <ul>
            <li>Drag & drop generated stickers and cards onto the sheet.</li>
            <li>Duplicate elements to fill the page.</li>
            <li>Generate artistic backgrounds for the sheet using AI.</li>
            <li><b>Export:</b> Download in full 300 DPI resolution (PNG), ready for printing shop or home printer.</li>
        </ul>`
    },

    'guide.section.harmony.title': { ru: 'Бренд Кит (Harmony)', en: 'Brand Kit (Harmony)' },
    'guide.section.harmony.text': {
        ru: `Генератор полного пакета айдентики.<br/>
        На основе данных вашей компании (из визитки или введенных вручную) создает за один проход:<br/>
        1. <b>Логотип:</b> Минималистичный векторный знак.
        2. <b>Паттерн:</b> Бесшовный узор для фона или упаковки.
        3. <b>Соцсети:</b> Аватар для профиля.
        4. <b>Баннер:</b> Обложка для сайта или Facebook.
        <br/>Всё генерируется в едином визуальном стиле и цветовой гамме.`,
        en: `Full identity package generator.<br/>
        Based on your company data (from card or manual input) creates in one pass:<br/>
        1. <b>Logo:</b> Minimalist vector mark.
        2. <b>Pattern:</b> Seamless pattern for backgrounds or packaging.
        3. <b>Social:</b> Profile avatar.
        4. <b>Banner:</b> Cover image for website or Facebook.
        <br/>All generated in a consistent visual style and color palette.`
    },

    // --- BACKUP / FREE MANUAL WORKFLOW ---
    'backup.title': { ru: 'Резервный режим (Без API)', en: 'Backup Mode (No API)' },
    'backup.subtitle': { ru: 'Скопируйте промпт, сгенерируйте бесплатно на внешнем сайте и вставьте результат!', en: 'Copy prompt, generate for free on an external site, and paste result!' },
    'backup.copyPrompt': { ru: 'Скопировать промпт', en: 'Copy Prompt' },
    'backup.promptCopied': { ru: 'Промпт скопирован в буфер!', en: 'Prompt copied to clipboard!' },
    'backup.togglePrompt': { ru: 'Показать текст промпта', en: 'Show Prompt Text' },
    'backup.hidePrompt': { ru: 'Скрыть текст промпта', en: 'Hide Prompt Text' },
    'backup.uploadResult': { ru: 'Загрузить результат (PNG/JPG)', en: 'Upload Result (PNG/JPG)' },
    'backup.pasteNotice': { ru: 'Подсказка: нажимайте Ctrl+V прямо в окне для вставки картинки из буфера!', en: 'Tip: Press Ctrl+V anywhere in the window to paste image from clipboard!' },
    'backup.imageLoadedSuccess': { ru: 'Изображение загружено! Теперь можно удалить фон, добавить контур и векторизовать.', en: 'Image loaded! Now you can remove background, add outline, and vectorize.' },
    'backup.imagePastedSuccess': { ru: 'Изображение вставлено из буфера обмена!', en: 'Image pasted from clipboard!' },
};
