// === 1. 選取網頁上的元件 ===
const navHomeBtn = document.getElementById('nav-home-btn');
const navAdminBtn = document.getElementById('nav-admin-btn');
const homePage = document.getElementById('home-page');
const adminPage = document.getElementById('admin-page');
const flashcard = document.getElementById('flashcard');

// === 2. 點擊卡片翻面功能 ===
flashcard.addEventListener('click', () => {
    flashcard.classList.toggle('flipped'); // 切換翻面狀態
});

// === 3. 切換頁面功能（主頁/管理後台） ===
navHomeBtn.addEventListener('click', () => {
    navHomeBtn.classList.add('active');
    navAdminBtn.classList.remove('active');
    homePage.classList.remove('hidden');
    adminPage.classList.add('hidden');
});

navAdminBtn.addEventListener('click', () => {
    navAdminBtn.classList.add('active');
    navHomeBtn.classList.remove('active');
    adminPage.classList.remove('hidden');
    homePage.classList.add('hidden');
});

// === 4. 單字資料庫與初始化 ===
// 如果以前有存過單字就讀出來，沒有的話就用預設的 Apple
let wordBank = JSON.parse(localStorage.getItem('wordBank')) || [
    { word: 'Apple', translation: 'n. 蘋果', pos: 'Noun', sentence: 'An apple a day.', root: '無' }
];
let currentIndex = 0; // 目前看到第幾張字卡

// 更新主畫面字卡內容的函式
function updateCard() {
    // 【修正防呆】如果單字庫被刪到變空的，顯示提示而不讓程式崩潰
    if (wordBank.length === 0) {
        document.getElementById('word-title').innerText = '尚無單字';
        document.getElementById('word-translation').innerText = '請至管理後台新增';
        document.getElementById('word-pos').innerText = '-';
        document.getElementById('word-sentence').innerText = '-';
        document.getElementById('word-root').innerText = '-';
        return;
    }

    const currentData = wordBank[currentIndex];
    // 【優化】加入 || '' 防止欄位沒填時在畫面上顯示 "undefined"
    document.getElementById('word-title').innerText = currentData.word || '';
    document.getElementById('word-translation').innerText = currentData.translation || '';
    document.getElementById('word-pos').innerText = currentData.pos || '無';
    document.getElementById('word-sentence').innerText = currentData.sentence || '無例句';
    document.getElementById('word-root').innerText = currentData.root || '無';
    
    // 每次換單字時，確保卡片回到正面
    // 【提醒】請確保你在程式碼最前面有選取 flashcard 元件
    if (typeof flashcard !== 'undefined') {
        flashcard.classList.remove('flipped');
    }
}

// === 5. 上一個 / 下一個按鈕功能 ===
document.getElementById('next-btn').addEventListener('click', (e) => {
    e.stopPropagation(); // 防止觸發卡片翻面
    if (wordBank.length === 0) return; // 【防呆】沒單字就不執行
    currentIndex = (currentIndex + 1) % wordBank.length; // 超過最後一張就回到第一張
    updateCard();
});

document.getElementById('prev-btn').addEventListener('click', (e) => {
    e.stopPropagation(); // 防止觸發卡片翻面
    if (wordBank.length === 0) return; // 【防呆】沒單字就不執行
    currentIndex = (currentIndex - 1 + wordBank.length) % wordBank.length; // 小於第一張就去最後一張
    updateCard();
});

// === 6. 手動儲存新單字功能 ===
document.getElementById('save-word-btn').addEventListener('click', () => {
    const word = document.getElementById('input-word').value.trim();
    const translation = document.getElementById('input-translation').value.trim();
    const pos = document.getElementById('input-pos').value.trim();
    const sentence = document.getElementById('input-sentence').value.trim();
    const root = document.getElementById('input-root').value.trim();

    if (!word || !translation) {
        alert('請至少輸入英文單字和中文翻譯！');
        return;
    }

    // 把新單字包成一個物件，推進單字庫
    wordBank.push({ word, translation, pos, sentence, root });
    
    // 儲存到瀏覽器的 localStorage 裡
    localStorage.setItem('wordBank', JSON.stringify(wordBank));
    
    alert('單字儲存成功！');
    
    // 清空輸入框
    document.getElementById('input-word').value = '';
    document.getElementById('input-translation').value = '';
    document.getElementById('input-pos').value = '';
    document.getElementById('input-sentence').value = '';
    document.getElementById('input-root').value = '';

    // 【優化】如果本來是空的，加了第一個單字後自動把索引轉回 0 並更新畫面
    if (wordBank.length === 1) {
        currentIndex = 0;
    }
    updateCard();
});

// 網頁打開時，先執行一次更新畫面
updateCard();

// === 7. 呼叫 API 自動填入功能 ===
document.getElementById('auto-fill-btn').addEventListener('click', async () => {
    const word = document.getElementById('input-word').value.trim();
    const btn = document.getElementById('auto-fill-btn');
    
    if (!word) {
        alert('請先輸入英文單字再點擊自動填入！');
        return;
    }

    // 顯示載入中提示，並暫時停用按鈕防止重複點擊
    btn.innerText = '查詢中...';
    btn.disabled = true;

    try {
        // 呼叫免費的網路字典 API
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        
        if (!response.ok) {
            throw new Error('找不到該單字的資料');
        }

        const data = await response.json();
        
        // 【修正防呆】確保有抓到陣列資料
        if (!data || data.length === 0) {
            throw new Error('找不到該單字的資料');
        }
        
        const wordInfo = data[0];
        const firstMeaning = wordInfo.meanings?.[0];
        const firstDefinition = firstMeaning?.definitions?.[0];

        // 1. 抓取詞性 (Part of Speech)
        const pos = firstMeaning?.partOfSpeech || 'unknown';
        document.getElementById('input-pos').value = pos;

        // 2. 抓取英文釋義
        const definition = firstDefinition?.definition || '';
        document.getElementById('input-translation').value = definition ? `(英) ${definition}` : '';

        // 3. 抓取例句 (Example) - 【最容易壞掉的地方！】
        // 使用 ?. 防止某一航段資料不存在而當機，並提供預設文字
        const example = firstDefinition?.example || 'No example available.';
        document.getElementById('input-sentence').value = example;

        // 4. 字根分析 (API 沒提供，自動填入無或提示)
        document.getElementById('input-root').value = '請自行分析字根';

        alert('資料自動填入成功！\n(提示：可手動將英文釋義修改為中文翻譯喔)');

    } catch (error) {
        console.error(error); // 在開發者主控台列印錯誤，方便 debug
        alert('查詢失敗，請檢查單字是否拼錯，或手動輸入資料。');
    } finally {
        // 還原按鈕文字與狀態
        btn.innerText = '自動填入 (API)';
        btn.disabled = false;
    }
});