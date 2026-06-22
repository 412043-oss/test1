
// 1. 請在下方引號內填入你複製的 GAS 網頁應用程式網址 (exec 結尾的那個)
// ==========================================
const GAS_API_URL = "請把這段文字換成你剛剛複製的GAS網址";

// ==========================================
// 2. 原本的畫面元件抓取與讀取
// ==========================================
const navHomeBtn = document.getElementById('nav-home-btn');
const navAdminBtn = document.getElementById('nav-admin-btn');
const homePage = document.getElementById('home-page');
const adminPage = document.getElementById('admin-page');
const flashcard = document.getElementById('flashcard');

// 點擊卡片翻面功能
if (flashcard) {
    flashcard.addEventListener('click', () => {
        flashcard.classList.toggle('flipped'); // 切換正面背面狀態
    });
}

// 切換頁面功能（主頁 / 管理後台）
if (navHomeBtn && navAdminBtn && homePage && adminPage) {
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
}

// ==========================================
// 3. 新增功能：API 自動填入單字資訊
// ==========================================
const autoFillBtn = document.getElementById('autoFillBtn');
if (autoFillBtn) {
    autoFillBtn.addEventListener('click', async () => {
        const wordInput = document.getElementById('wordInput');
        if (!wordInput || !wordInput.value.trim()) {
            alert('請先輸入英文單字！');
            return;
        }
        const word = wordInput.value.trim();

        try {
            // 呼叫免費字典 API
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            if (!response.ok) throw new Error('找不到該單字的資料');
            
            const data = await response.json();
            const wordData = data[0];

            // 抓取 API 回傳的欄位
            const pos = wordData.meanings[0].partOfSpeech;
            const definition = wordData.meanings[0].definitions[0].definition;
            const example = wordData.meanings[0].definitions[0].example || "No example available.";

            // 將資料自動填入輸入框
            if (document.getElementById('translationInput')) document.getElementById('translationInput').value = definition;
            if (document.getElementById('posInput')) document.getElementById('posInput').value = pos;
            if (document.getElementById('sentenceInput')) document.getElementById('sentenceInput').value = example;
            if (document.getElementById('rootInput')) document.getElementById('rootInput').value = "可自行補充字根分析";

            alert('API 自動填入完成！');
        } catch (error) {
            alert('查詢失敗：' + error.message);
        }
    });
}

// ==========================================
// 4. 新增功能：將資料傳送到 Google 試算表 (POST)
// ==========================================
const submitBtn = document.getElementById('submitBtn');
if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
        const word = document.getElementById('wordInput')?.value.trim();
        const translation = document.getElementById('translationInput')?.value.trim();
        const pos = document.getElementById('posInput')?.value.trim();
        const sentence = document.getElementById('sentenceInput')?.value.trim();
        const root = document.getElementById('rootInput')?.value.trim();

        if (!word) {
            alert('請輸入要儲存的單字！');
            return;
        }

        // 打包要傳送給 GAS 的資料
        const payload = {
            word: word,
            translation: translation,
            pos: pos,
            sentence: sentence,
            root: root
        };

        try {
            // 發送 POST 請求到你的 GAS
            const response = await fetch(GAS_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain" // 用 text/plain 繞過瀏覽器的 CORS 限制
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('連線到試算表失敗');

            const result = await response.json();

            if (result.result === "success") {
                alert('成功寫入 Google 試算表！');
                
                // 成功後自動清空欄位，方便輸入下一個單字
                if (document.getElementById('wordInput')) document.getElementById('wordInput').value = "";
                if (document.getElementById('translationInput')) document.getElementById('translationInput').value = "";
                if (document.getElementById('posInput')) document.getElementById('posInput').value = "";
                if (document.getElementById('sentenceInput')) document.getElementById('sentenceInput').value = "";
                if (document.getElementById('rootInput')) document.getElementById('rootInput').value = "";
            } else {
                alert('寫入失敗：' + result.error);
            }
        } catch (error) {
            alert('傳送到試算表發生錯誤：' + error.message);
        }
    });
}