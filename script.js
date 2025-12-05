// URL к JSON файлу с ключами (замени на свой GitHub Pages URL)
const KEYS_URL = 'https://YOUR_USERNAME.github.io/mod-auth/keys.json';

// Генерация случайного ключа
function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (i < 3) key += '-';
    }
    return key;
}

// Форматирование даты
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU');
}

// Получение срока действия в читаемом формате
function getDurationText(minutes) {
    if (minutes === 3) return '3 минуты';
    if (minutes === 10080) return '7 дней';
    if (minutes === 43200) return '30 дней';
    if (minutes === 129600) return '90 дней';
    return `${minutes} минут`;
}

// Загрузка существующих ключей
async function loadKeys() {
    try {
        const response = await fetch(KEYS_URL + '?t=' + Date.now());
        if (!response.ok) {
            // Если файл не существует, создаем пустой массив
            return { keys: [] };
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки ключей:', error);
        return { keys: [] };
    }
}

// Сохранение ключей (для локального тестирования)
function saveKeysLocally(keysData) {
    localStorage.setItem('mod_keys', JSON.stringify(keysData));
    console.log('Ключи сохранены локально. Для продакшена нужно настроить GitHub API.');
}

// Загрузка ключей из localStorage (для тестирования)
function loadKeysLocally() {
    const data = localStorage.getItem('mod_keys');
    return data ? JSON.parse(data) : { keys: [] };
}

// Генерация нового ключа
document.getElementById('generateBtn').addEventListener('click', async () => {
    const duration = parseInt(document.getElementById('duration').value);
    const key = generateKey();
    const now = Date.now();
    const expiresAt = now + (duration * 60 * 1000);

    const newKey = {
        key: key,
        createdAt: now,
        expiresAt: expiresAt,
        duration: duration,
        hwid: null,
        used: false,
        usedAt: null
    };

    // Загружаем существующие ключи
    const keysData = loadKeysLocally();
    keysData.keys.push(newKey);
    
    // Сохраняем
    saveKeysLocally(keysData);

    // Отображаем результат
    document.getElementById('keyDisplay').textContent = key;
    document.getElementById('expiryInfo').textContent = getDurationText(duration);
    document.getElementById('createdInfo').textContent = formatDate(now);
    document.getElementById('result').style.display = 'block';

    // Обновляем список
    displayKeys();
});

// Копирование ключа
document.getElementById('copyBtn').addEventListener('click', () => {
    const key = document.getElementById('keyDisplay').textContent;
    navigator.clipboard.writeText(key).then(() => {
        const btn = document.getElementById('copyBtn');
        const originalText = btn.textContent;
        btn.textContent = 'Скопировано!';
        btn.style.background = '#4CAF50';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    });
});

// Отображение списка ключей
function displayKeys() {
    const keysData = loadKeysLocally();
    const container = document.getElementById('keysList');
    
    if (keysData.keys.length === 0) {
        container.innerHTML = '<p class="loading">Нет активных ключей</p>';
        return;
    }

    const now = Date.now();
    let html = '';

    keysData.keys.forEach(keyData => {
        const isExpired = now > keyData.expiresAt;
        const status = isExpired ? 'expired' : (keyData.used ? 'used' : 'active');
        const statusText = isExpired ? 'Истек' : (keyData.used ? 'Используется' : 'Активен');
        const statusClass = isExpired ? 'status-expired' : (keyData.used ? 'status-used' : 'status-active');

        html += `
            <div class="key-item ${isExpired ? 'expired' : ''}">
                <div class="key-item-header">
                    <span class="key-item-key">${keyData.key}</span>
                    <span class="key-item-status ${statusClass}">${statusText}</span>
                </div>
                <div class="key-item-info">
                    <p><strong>Создан:</strong> ${formatDate(keyData.createdAt)}</p>
                    <p><strong>Истекает:</strong> ${formatDate(keyData.expiresAt)}</p>
                    <p><strong>Срок:</strong> ${getDurationText(keyData.duration)}</p>
                    ${keyData.hwid ? `<p><strong>HWID:</strong> ${keyData.hwid.substring(0, 16)}...</p>` : ''}
                    ${keyData.usedAt ? `<p><strong>Активирован:</strong> ${formatDate(keyData.usedAt)}</p>` : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Обновление списка
document.getElementById('refreshBtn').addEventListener('click', () => {
    displayKeys();
});

// Загрузка при старте
displayKeys();

// Экспорт данных для GitHub
document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+E для экспорта
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        const keysData = loadKeysLocally();
        const dataStr = JSON.stringify(keysData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'keys.json';
        a.click();
        URL.revokeObjectURL(url);
        alert('Файл keys.json скачан! Загрузите его в ваш GitHub репозиторий.');
    }
});
