// 発音クリッカー

// ゲーム初期状態
var state = {
    money: 0,
    totalMoney: 0,
    upgrades: { vocal: 0, radar: 0, dictBonus: 0, autoBoost: 0 },
    facilities: {
        blocks: 0, ebook: 0, cram: 0, ai: 0, lab: 0, academy: 0, satellite: 0,
        neural: 0, orbital: 0, lunar: 0, dyson: 0, galactic: 0
    },
    dictionary: [],
    skippedWords: [],
    bookmarks: [],
    unlockedAchievements: [],
    lastSeenAchvCount: 0,
    stats: { bestCombo: 0, totalCorrect: 0 },
    currentWord: null,
    theme: 'light'
};

// 実績定義（お金の経済とは無関係。発音・語彙の達成度のみで解除される）
var ACHIEVEMENTS = [
    { id: 'first_word',   icon: '🎤', name: '発音デビュー',     desc: '初めて単語を正解した',            check: function(s) { return s.stats.totalCorrect >= 1; } },
    { id: 'combo10',      icon: '🔥', name: '絶好調',           desc: '10連続正解を達成',                check: function(s) { return s.stats.bestCombo >= 10; } },
    { id: 'combo25',      icon: '⚡', name: '発音マスター',     desc: '25連続正解を達成',                check: function(s) { return s.stats.bestCombo >= 25; } },
    { id: 'dict50',       icon: '📖', name: '単語コレクター',   desc: '図鑑に50語登録',                  check: function(s) { return s.dictionary.length >= 50; } },
    { id: 'dict200',      icon: '📚', name: '語彙の達人',       desc: '図鑑に200語登録',                 check: function(s) { return s.dictionary.length >= 200; } },
    { id: 'dict_complete',icon: '🏆', name: '図鑑コンプリート', desc: '全ての単語を登録',                check: function(s) { return s.dictionary.length >= wordDatabase.length; } },
    { id: 'bookmark10',   icon: '🔖', name: '復習の達人',       desc: '10語をブックマーク',              check: function(s) { return s.bookmarks.length >= 10; } },
    { id: 'economy_complete', icon: '👑', name: '経済制覇', desc: '最終施設を購入', check: function(s) { return s.facilities.galactic >= 1; } }
];

// 施設定義
var FACILITIES = {
    blocks:    { jp: '英語の単語帳',           en: 'Vocabulary Book',       ipa: '/ vəˈkæbjəleri bʊk /',      base: 15,       mult: 1.15, dps: 0.2 },
    ebook:     { jp: '発音学習アプリ',         en: 'Pronunciation App',     ipa: '/ prəˌnʌnsiˈeɪʃn æp /',     base: 200,      mult: 1.15, dps: 2.5 },
    cram:      { jp: '発音電子辞書',           en: 'Smart Dictionary',      ipa: '/ smɑːrt ˈdɪkʃəneri /',     base: 3000,     mult: 1.15, dps: 35 },
    ai:        { jp: 'オンライン英会話',       en: 'Online English Lesson', ipa: '/ ˈɒnlaɪn ˈɪŋɡlɪʃ ˈlesn /', base: 45000,    mult: 1.15, dps: 480 },
    lab:       { jp: '英会話教室',             en: 'English Academy',       ipa: '/ ˈɪŋɡlɪʃ əˈkædəmi /',      base: 2700000,   mult: 1.15, dps: 7000 },
    academy:   { jp: 'AIネイティブ講師',       en: 'AI Native Tutor',       ipa: '/ ˌeɪˈaɪ ˈneɪtɪv ˈtuːtər /', base: 160000000, mult: 1.15, dps: 100000 },
    satellite: { jp: '海外サマーキャンプ',     en: 'Summer Camp',           ipa: '/ ˈsʌmər kæmp /',          base: 9600000000, mult: 1.15, dps: 1500000 },
    neural:    { jp: 'インターナショナルスクール', en: 'International School',  ipa: '/ ˌɪntərˈnæʃnəl skuːl /',    base: 570000000000, mult: 1.15, dps: 24000000 },
    orbital:   { jp: '短期海外留学',           en: 'Study Abroad Program',  ipa: '/ ˈstʌdi əˈbrɔːd ˈproʊɡræm /', base: 34000000000000, mult: 1.15, dps: 380000000 },
    lunar:     { jp: '名門海外大学',           en: 'Elite University',      ipa: '/ ɪˈliːt ˌjuːnɪˈvɜːrsəti /', base: 2000000000000000, mult: 1.15, dps: 6000000000 },
    dyson:     { jp: '外資系グローバル企業',   en: 'Global Corporation',    ipa: '/ ˈɡloʊbl ˌkɔːrpəˈreɪʃn /', base: 120000000000000000, mult: 1.15, dps: 95000000000 },
    galactic:  { jp: '国連グローバル会議',     en: 'UN Global Summit',      ipa: '/ juː-en ˈɡloʊbl ˈsʌmɪt /', base: 7200000000000000000, mult: 1.15, dps: 1500000000000 }
};

// 強化定義
var UPGRADES = {
    vocal:     { name: '発声トレーニング',   desc: '手動獲得を +$1 ＆ +2% 強化', base: 50,   mult: 1.8,  max: 100 },
    radar:     { name: '難単語レーダー',      desc: '難しい単語が出やすくなる', base: 100,  mult: 25,   max: 5 },
    dictBonus: { name: '語彙シナジー',       desc: '図鑑ボーナスを +1% 強化', base: 500,  mult: 20,   max: 10 },
    autoBoost: { name: '音響解析装置',       desc: '自動生産の効率を +10%',   base: 100,  mult: 2.0,  max: 100 }
};

// 状態変数
var word = null;       // 現在の単語
var skipped = false;   // スキップ中か
var buying = null;     // 購入中の施設
var speaking = false;  // TTS再生中か
var listening = false; // 認識中か
var micOn = false;     // 連続モードか
var transitioning = false;
var micMode = 'word';  // 'word' or 'modal'
var practiceMode = false;
var dictFilter = 'all';
var recognition = null;
var audioCtx = null;
var cachedVoice = null;
var renderTimer = 0;
var failCount = 0;
var combo = 0;         // 連続正解数
var isReviewWord = false; // 復習（スキップ済み単語）の再出題か

// DOM取得
var $ = function(id) { return document.getElementById(id); };

var el = {
    money: $('money'), dps: $('dps'), bonus: $('bonus'),
    totalMoney: $('total-money'), dictProgress: $('dict-progress'),
    wordArea: $('word-area'), word: $('word'), ipa: $('ipa'),
    levelBadge: $('level-badge'), reward: $('reward'),
    comboBadge: $('combo-badge'), comboCount: $('combo-count'), comboBonusPct: $('combo-bonus-pct'),
    reviewBadge: $('review-badge'),
    accuracyBadge: $('accuracy-badge'), accuracyValue: $('accuracy-value'),
    meaningBox: $('meaning-box'), meaningText: $('meaning-text'),
    inlineBookmark: $('inline-bookmark'),
    heard: $('heard'), mic: $('mic'), micStatus: $('mic-status'),
    listen: $('listen'), skip: $('skip'),
    textInput: $('text-input'), textSubmit: $('text-submit'),
    facilities: $('facilities-list'), upgrades: $('upgrades-list'),
    dictCount: $('dict-count'), dictTotal: $('dict-total'),
    dictMilestone: $('dict-milestone'), dictBar: $('dict-bar'),
    dictGrid: $('dict-grid'), dictFiltersWrap: document.querySelector('.dict-filters'),
    dictUnlockedOnly: $('dict-unlocked-only'),
    achvGrid: $('achv-grid'), achvCount: $('achv-count'), achvTotal: $('achv-total'),
    achvTabBadge: $('achv-tab-badge'),
    statTotalCorrect: $('stat-total-correct'), statBestCombo: $('stat-best-combo'),
    modalAccuracyBadge: $('modal-accuracy-badge'), modalAccuracyValue: $('modal-accuracy-value'),
    modalGoal: $('modal-goal'), modalGoalClose: $('modal-goal-close'),
    goalTotalMoney: $('goal-total-money'), goalDictCount: $('goal-dict-count'),
    modalConfirmReset: $('modal-confirm-reset'), confirmResetYes: $('confirm-reset-yes'),
    confirmResetCancel: $('confirm-reset-cancel'),
    reset: $('reset'),
    modal: $('modal'), modalNameJp: $('modal-name-jp'),
    modalNameEn: $('modal-name-en'), modalIpa: $('modal-ipa'),
    modalMic: $('modal-mic'), modalMicLabel: $('modal-mic-label'),
    modalHeard: $('modal-heard'),
    modalTextInput: $('modal-text-input'), modalTextSubmit: $('modal-text-submit'),
    modalCancel: $('modal-cancel'), modalClose: $('modal-close'),
    modalListen: $('modal-listen'),
    floats: $('floats'), toasts: $('toasts'),
    btnSettings: $('btn-settings'), settingsOverlay: $('settings-overlay'),
    settingsClose: $('settings-close'), themeToggle: $('theme-toggle'),
    btnHelp: $('btn-help'), modalHelp: $('modal-help'), modalHelpClose: $('modal-help-close'),
    volumeSlider: $('volume-slider'), slowModeToggle: $('slow-mode-toggle'),
    voiceSelect: $('voice-select'),
    rewardInfoBtn: $('reward-info-btn'), rewardInfoText: $('reward-info-text')
};

// 通貨フォーマット
var CURRENCY_UNITS = [
    [1e33, 'Dc'], [1e30, 'No'], [1e27, 'Oc'], [1e24, 'Sp'],
    [1e21, 'Sx'], [1e18, 'Qi'], [1e15, 'Q'], [1e12, 'T'],
    [1e9, 'B'], [1e6, 'M'], [1e3, 'K']
];
function fmt(v) {
    for (var i = 0; i < CURRENCY_UNITS.length; i++) {
        if (v >= CURRENCY_UNITS[i][0]) return '$' + (v / CURRENCY_UNITS[i][0]).toFixed(2) + CURRENCY_UNITS[i][1];
    }
    return '$' + v.toFixed(2);
}

// 品詞バッジ（色だけでなくフルネームをtitleで補足）
var POS_NAMES = { '名': '名詞', '動': '動詞', '形': '形容詞', '副': '副詞' };
function posBadgeHtml(pos) {
    var p = pos || '名';
    var full = POS_NAMES[p] || p;
    return '<span class="pos-badge" data-pos="' + p + '" title="' + full + '">' + p + '</span>';
}

// 図鑑ボーナス
function dictBonus() {
    var pct = 3 + state.upgrades.dictBonus;
    var milestones = Math.floor(state.dictionary.length / 5);
    return milestones * (pct / 100);
}

function addDictionaryWord(wordStr) {
    if (state.dictionary.indexOf(wordStr) >= 0) return;
    var oldM = Math.floor(state.dictionary.length / 5);
    state.dictionary.push(wordStr);
    var newM = Math.floor(state.dictionary.length / 5);
    
    toast('図鑑登録', '「' + wordStr + '」を登録しました', 'info');
    if (newM > oldM) {
        var bonus = 3 + state.upgrades.dictBonus;
        setTimeout(function() {
            toast('ボーナス獲得！', '図鑑ボーナス(+' + bonus + '%)が追加されました', 'ok');
        }, 150);
    }
    renderDict();
    checkAchievements();
}

// 実績チェック（未解除のものだけ判定してトーストで通知）
function checkAchievements() {
    var unlockedNew = false;
    ACHIEVEMENTS.forEach(function(a) {
        if (state.unlockedAchievements.indexOf(a.id) >= 0) return;
        if (a.check(state)) {
            state.unlockedAchievements.push(a.id);
            toast('実績解除！', a.icon + ' ' + a.name + ' - ' + a.desc, 'ok');
            save();
            unlockedNew = true;
        }
    });
    updateAchvTabBadge();

    if (unlockedNew && document.getElementById('tab-achievements').classList.contains('active')) {
        renderAchievements();
        state.lastSeenAchvCount = state.unlockedAchievements.length;
        save();
        updateAchvTabBadge();
    }
}

// 実績タブの未読バッジ更新
function updateAchvTabBadge() {
    el.achvTabBadge.hidden = state.unlockedAchievements.length <= state.lastSeenAchvCount;
}

// 実績タブを見ている間、実績解除を伴わない統計更新（コンボ等）も反映する
function refreshAchvStatsIfVisible() {
    if (document.getElementById('tab-achievements').classList.contains('active')) {
        el.statTotalCorrect.textContent = state.stats.totalCorrect;
        el.statBestCombo.textContent = state.stats.bestCombo;
    }
}

// テーマ切替
function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    el.themeToggle.checked = state.theme === 'dark';
}

// コンボ表示更新
function updateComboUI() {
    if (combo >= 2) {
        el.comboBadge.hidden = false;
        el.comboCount.textContent = combo;
        el.comboBonusPct.textContent = Math.min(combo * 2, 50);
    } else {
        el.comboBadge.hidden = true;
    }
}

// 発音精度スコア表示
function showAccuracyOn(badgeEl, valueEl, rate) {
    var pct = Math.round(rate * 100);
    badgeEl.hidden = false;
    valueEl.textContent = pct + '%';
    badgeEl.classList.remove('low', 'mid', 'high');
    if (pct >= 90) badgeEl.classList.add('high');
    else if (pct >= 70) badgeEl.classList.add('mid');
    else badgeEl.classList.add('low');
}
function showAccuracy(rate) {
    showAccuracyOn(el.accuracyBadge, el.accuracyValue, rate);
}

// 手動獲得額
function clickValue(base) {
    var b = base || (word ? word.baseValue : 1);
    var vocalFlat = state.upgrades.vocal * 1.0;
    var vocalMult = 1 + (state.upgrades.vocal * 0.02);
    var dpsBonus = dpsValue() * 3.0;
    var comboMult = 1 + Math.min(combo * 0.02, 0.5);
    var raw = (b + vocalFlat + dpsBonus) * vocalMult * (1 + dictBonus()) * comboMult;

    var diffMult = 1.0;
    if (state.difficulty === 'easy') diffMult = 0.75;
    if (state.difficulty === 'hard') diffMult = 1.2;
    
    return raw * diffMult;
}

// 毎秒の自動生産額
function dpsValue() {
    var raw = 0;
    for (var k in state.facilities) {
        raw += state.facilities[k] * FACILITIES[k].dps;
    }
    return raw * (1 + dictBonus()) * (1 + state.upgrades.autoBoost * 0.10);
}

function facCost(id) {
    return Math.ceil(FACILITIES[id].base * Math.pow(FACILITIES[id].mult, state.facilities[id]));
}
function upgCost(id) {
    return Math.ceil(UPGRADES[id].base * Math.pow(UPGRADES[id].mult, state.upgrades[id]));
}

// 効果音
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function beep(freq, dur, vol) {
    if (!audioCtx) return;
    var t = audioCtx.currentTime;
    var o = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    var finalVol = (vol || 0.1) * (state.volume !== undefined ? state.volume : 1.0);
    g.gain.linearRampToValueAtTime(finalVol, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur);
}

function sfxOk() { beep(523, 0.3, 0.1); beep(660, 0.3, 0.1); beep(784, 0.4, 0.1); }
function sfxFail() { beep(140, 0.25, 0.12); }
function sfxBuy() { beep(988, 0.12, 0.08); beep(1319, 0.4, 0.12); }
function sfxMic() { beep(700, 0.08, 0.04); }

// TTS用ボイスのプリロード
function loadVoice() {
    var voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    if (voices.length === 0) return;

    // プルダウンを初期化
    if (el.voiceSelect && el.voiceSelect.options.length === 0) {
        var html = '';
        for (var i = 0; i < voices.length; i++) {
            var selected = '';
            if (state.voiceURI) {
                if (voices[i].voiceURI === state.voiceURI) selected = 'selected';
            } else if (voices[i].lang === 'en-US' || voices[i].lang.startsWith('en')) {
                // 優先的に英語を選択状態にする
                if (!html.includes('selected')) selected = 'selected';
            }
            html += '<option value="' + voices[i].voiceURI + '" ' + selected + '>' + voices[i].name + ' (' + voices[i].lang + ')</option>';
        }
        el.voiceSelect.innerHTML = html;
        if (!state.voiceURI && el.voiceSelect.value) {
            state.voiceURI = el.voiceSelect.value;
            save();
        }
    }

    if (state.voiceURI) {
        cachedVoice = voices.find(function(v) { return v.voiceURI === state.voiceURI; });
    }
    
    if (!cachedVoice) {
        cachedVoice = voices.find(function(v) { return v.lang === 'en-US'; })
            || voices.find(function(v) { return v.lang.startsWith('en'); })
            || voices[0];
    }
}

window._tts_utterances = []; // GC対策

// TTS (Promise)
function speak(text) {
    return new Promise(function(ok) {
        if (!window.speechSynthesis) {
            toast('エラー', 'お使いのブラウザは音声合成に非対応です', 'bad');
            ok(); return; 
        }
        
        if (speechSynthesis.speaking || speechSynthesis.pending) {
            speechSynthesis.cancel();
        }

        if (!cachedVoice) loadVoice();
        
        var u = new SpeechSynthesisUtterance(text);
        window._tts_utterances.push(u); // ガベージコレクション回避

        u.lang = 'en-US'; 
        u.rate = state.slowMode ? 0.45 : 0.9;
        u.volume = state.volume !== undefined ? state.volume : 1.0;
        
        if (cachedVoice) {
            u.voice = cachedVoice;
        }

        speaking = true;
        if (listening && recognition) recognition.stop();

        u.onstart = function() {
            // TTS開始確認用
        };

        var cleanup = function() {
            speaking = false;
            restartMicIfNeeded();
            window._tts_utterances = window._tts_utterances.filter(function(item) { return item !== u; });
        };

        u.onend = function() {
            cleanup();
            ok();
        };
        
        u.onerror = function(e) { 
            console.error('TTS Error:', e);
            if (e.error !== 'interrupted' && e.error !== 'canceled') {
                toast('音声エラー', '失敗理由: ' + (e.error || '不明'), 'bad');
            }
            cleanup();
            ok(); 
        };
        
        try {
            speechSynthesis.speak(u);
        } catch(e) {
            console.error('TTS Speak Exception:', e);
            toast('音声エラー', '音声エンジンの起動に失敗しました', 'bad');
            cleanup();
            ok();
        }
        
        // フォールバック: 3秒経ってもonendが呼ばれない場合、強制解除
        setTimeout(function() {
            if (speaking) {
                cleanup();
                ok();
            }
        }, 3000);
    });
}

// 音声認識
function setupRecognition() {
    if (recognition) return;
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = function() {
        listening = true;
        updateMicUI();
    };

    recognition.onresult = function(e) {
        var text = e.results[0][0].transcript;
        onHeard(text);
    };

    recognition.onerror = function(e) {
        if (e.error !== 'aborted') onError(e.error);
    };

    recognition.onend = function() {
        listening = false;
        updateMicUI();
        restartMicIfNeeded();
    };
}

function restartMicIfNeeded() {
    if (micOn && !transitioning && !skipped && !speaking) {
        setTimeout(function() {
            if (micOn && !listening && !transitioning && !speaking) {
                try { recognition.start(); } catch(e) {}
            }
        }, 250);
    }
}

function toggleMic() {
    setupRecognition();
    if (!recognition) {
        toast('非対応', 'このブラウザは音声認識に対応していません', 'bad');
        return;
    }
    micOn = !micOn;

    if (micOn) {
        sfxMic();
        if (!listening) { try { recognition.start(); } catch(e) {} }
        toast('マイクON', '連続で発音できます', 'ok');
    } else {
        if (listening) recognition.stop();
        toast('マイクOFF', '音声入力を停止しました', 'info');
    }
    updateMicUI();
}

function updateMicUI() {
    el.mic.classList.toggle('on', micOn && listening);
    el.micStatus.textContent = micOn ? (listening ? '聞き取り中' : 'ON') : 'OFF';
    el.wordArea.classList.toggle('listening', listening && micOn && micMode === 'word');

    el.modalMic.classList.toggle('on', micOn && listening);
    el.modalMicLabel.textContent = micOn ? (listening ? '聞き取り中...' : 'ON') : 'タップしてON';
}

// レーベンシュタイン距離を用いた文字単位のエラー判定
function alignStrings(a, b) {
    var dp = [];
    for (var i = 0; i <= a.length; i++) {
        dp[i] = [];
        for (var j = 0; j <= b.length; j++) {
            if (i === 0) dp[i][j] = j;
            else if (j === 0) dp[i][j] = i;
            else {
                var cost = (a[i - 1] === b[j - 1]) ? 0 : 1;
                dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
            }
        }
    }
    var i = a.length, j = b.length;
    var errors = new Array(a.length).fill(false);
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) { i--; j--; }
        else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) { i--; j--; errors[i] = true; }
        else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) { i--; errors[i] = true; }
        else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) { j--; }
        else {
            if (i > 0) { i--; errors[i] = true; } else if (j > 0) { j--; }
        }
    }
    return errors;
}

// 発音エラー時のIPAハイライト（文字単位アライメントによる精度向上版）
function highlightIpaError(targetIpa, targetWord, recognizedText) {
    var rawIpa = targetIpa.replace(/\//g, '').trim();
    var t = targetWord.toLowerCase().replace(/[^a-z]/g, '');
    var r = recognizedText.toLowerCase().replace(/[^a-z]/g, '');
    if (t.length === 0 || rawIpa.length === 0) return targetIpa;
    
    var errors = alignStrings(t, r);
    var ipaErrors = new Array(rawIpa.length).fill(false);
    var errCount = 0;
    
    for (var i = 0; i < t.length; i++) {
        if (errors[i]) {
            errCount++;
            var startIpa = Math.floor((i / t.length) * rawIpa.length);
            var endIpa = Math.floor(((i + 1) / t.length) * rawIpa.length);
            for (var k = startIpa; k < endIpa; k++) ipaErrors[k] = true;
        }
    }
    
    if (t.length > 0 && errCount / t.length >= 0.6) {
        return '/ <span class="ipa-error">' + rawIpa + '</span> /';
    }
    
    var html = '', inError = false;
    for (var k = 0; k < rawIpa.length; k++) {
        if (ipaErrors[k] && !inError) { html += '<span class="ipa-error">'; inError = true; }
        else if (!ipaErrors[k] && inError) { html += '</span>'; inError = false; }
        html += rawIpa[k];
    }
    if (inError) html += '</span>';
    return '/ ' + html + ' /';
}

function onHeard(raw) {
    var clean = raw.toLowerCase().replace(/[.,!?;:'"()\-]/g, '').trim();

    if (micMode === 'word') {
        el.heard.textContent = '「' + raw + '」';
        var t = word.word.toLowerCase().replace(/[^a-z]/g, '');
        var r = clean.replace(/[^a-z]/g, '');
        var errors = alignStrings(t, r);
        var errCount = 0;
        for (var i = 0; i < t.length; i++) { if (errors[i]) errCount++; }
        var matchRate = t.length > 0 ? (t.length - errCount) / t.length : 0;
        
        var isExactMatch = (clean === word.word.toLowerCase());
        var isLenientMatch = (matchRate >= 0.7);
        var finalMatch = false;
        
        if (state.difficulty === 'easy') {
            finalMatch = isExactMatch || isLenientMatch;
        } else if (state.difficulty === 'hard') {
            finalMatch = isExactMatch;
        } else {
            finalMatch = isExactMatch || (failCount >= 3 && isLenientMatch);
        }

        showAccuracy(matchRate);

        if (finalMatch) {
            state.stats.totalCorrect++;
            combo++;
            if (combo > state.stats.bestCombo) state.stats.bestCombo = combo;
            updateComboUI();
            refreshAchvStatsIfVisible();
            onCorrect();
            checkAchievements();
        } else {
            failCount++;
            combo = 0;
            updateComboUI();
            onWrong(raw, matchRate);
        }
    } else if (micMode === 'modal') {
        el.modalHeard.textContent = '「' + raw + '」';
        var isMatch = false;
        var targetWord = practiceMode ? el.modalNameEn.textContent : (buying ? buying.en : '');
        var cleanTarget = targetWord.toLowerCase();

        if (practiceMode || (buying && buying.dictWordData)) {
            var t = cleanTarget.replace(/[^a-z]/g, '');
            var r = clean.replace(/[^a-z]/g, '');
            var errors = alignStrings(t, r);
            var errCount = 0;
            for (var i = 0; i < t.length; i++) { if (errors[i]) errCount++; }
            var matchRate = t.length > 0 ? (t.length - errCount) / t.length : 0;
            showAccuracyOn(el.modalAccuracyBadge, el.modalAccuracyValue, matchRate);

            isMatch = (clean === cleanTarget) || (state.difficulty === 'easy' && matchRate >= 0.7);
        } else {
            isMatch = fuzzy(clean, cleanTarget);
        }

        if (isMatch) {
            if (practiceMode) {
                var isSkipped = state.skippedWords.indexOf(targetWord) >= 0;
                if (isSkipped) {
                    state.skippedWords.splice(state.skippedWords.indexOf(targetWord), 1);
                    addDictionaryWord(targetWord);
                    toast('本登録完了', targetWord + ' を図鑑に本登録しました！', 'ok');
                    renderDict();
                } else {
                    toast('パーフェクト！', 'きれいな発音です', 'ok');
                }
                sfxOk();
                closeModal();
            } else {
                confirmBuy();
            }
        } else {
            sfxFail();
            el.modalHeard.textContent = '「' + raw + '」→「' + targetWord + '」と発音してください';
            el.modalIpa.innerHTML = highlightIpaError(el.modalIpa.textContent, targetWord, raw);
        }
    }
}

function fuzzy(heard, target) {
    var h = heard.replace(/[^a-z0-9 ]/g, '').trim();
    var t = target.replace(/[^a-z0-9 ]/g, '').trim();
    if (h === t || h.includes(t) || t.includes(h)) return true;
    // よくある聞き間違い
    if (t === 'alphabet blocks' && h === 'alphabet block') return true;
    if (t === 'ai tutor' && /^(i|eye|hay|eh i) tutor$/.test(h)) return true;
    if (t === 'english cram school' && /^english (gram|drum|cram)/.test(h)) return true;
    if (t === 'satellite broadcaster' && h === 'satellite broadcast') return true;
    return false;
}

function onError(type) {
    var msg = '音声の聞き取りに失敗しました';
    if (type === 'not-allowed') msg = 'マイクの使用が許可されていません';
    if (type === 'no-speech') msg = '音声が検出されませんでした';

    if (micMode === 'word') el.heard.textContent = msg;
    else el.modalHeard.textContent = msg;
    sfxFail();
}

// ゲームプレイ
function loadWord(forceNew) {
    failCount = 0;
    skipped = false;
    transitioning = false;
    el.meaningBox.hidden = true;
    el.inlineBookmark.style.display = 'none';
    el.skip.textContent = '⏭ スキップ';
    el.mic.classList.remove('disabled');

    if (!forceNew && state.currentWord) {
        var existing = wordDatabase.find(function(w) { return w.word === state.currentWord; });
        if (existing) word = existing;
        else word = null;
    } else {
        word = null;
    }

    if (!word) {
        isReviewWord = false;

        // 復習：スキップ済み単語を一定確率で優先出題（間隔反復の簡易版）
        var reviewPool = state.skippedWords.filter(function(w) { return state.dictionary.indexOf(w) < 0; });
        if (reviewPool.length > 0 && Math.random() < 0.3) {
            var reviewWordStr = reviewPool[Math.floor(Math.random() * reviewPool.length)];
            var reviewWordData = wordDatabase.find(function(w) { return w.word === reviewWordStr; });
            if (reviewWordData) {
                word = reviewWordData;
                isReviewWord = true;
            }
        }
    }

    if (!word) {
        // レーダーによる出現率
        var r = state.upgrades.radar;
        var dist = [
            [.50, .50, 0, 0],
            [.40, .40, .20, 0],
            [.35, .35, .20, .10],
            [.30, .30, .25, .15],
            [.25, .25, .30, .20],
            [.20, .20, .30, .30]
        ][r] || [.50, .50, 0, 0];

        var rand = Math.random(), lv = 1, cum = 0;
        for (var i = 0; i < dist.length; i++) {
            cum += dist[i];
            if (rand < cum) { lv = i + 1; break; }
        }

        var pool = wordDatabase.filter(function(w) { return w.level === lv; });
        if (!pool.length) pool = wordDatabase.filter(function(w) { return w.level === 1; });

        // 未登録単語を優先
        var unseen = pool.filter(function(w) { return state.dictionary.indexOf(w.word) < 0; });
        word = unseen.length ? unseen[Math.floor(Math.random() * unseen.length)]
                             : pool[Math.floor(Math.random() * pool.length)];

        state.currentWord = word.word;
        save();
    }

    el.word.textContent = word.word;
    el.ipa.textContent = word.ipa;

    var labels = ['中学', '高校', '2級', '準1級'];
    var classes = ['lv1', 'lv2', 'lv3', 'lv4'];
    el.levelBadge.textContent = labels[word.level - 1];
    el.levelBadge.className = 'badge ' + classes[word.level - 1];
    el.reviewBadge.hidden = !isReviewWord;
    el.accuracyBadge.hidden = true;

    el.reward.textContent = '+' + fmt(clickValue(word.baseValue));
    el.heard.textContent = micOn ? '聞き取り中...' : 'マイクをオンにして発音してください';

    if (micOn && !listening && !buying) {
        setTimeout(function() {
            if (micOn && !listening && !buying) {
                micMode = 'word';
                try { recognition.start(); } catch(e) {}
            }
        }, 250);
    }
}

function onCorrect() {
    transitioning = true;
    if (listening && recognition) recognition.stop();

    el.wordArea.classList.add('success');
    el.ipa.textContent = word.ipa;

    el.meaningBox.hidden = false;
    el.meaningText.innerHTML = posBadgeHtml(word.pos) + word.meaning;

    el.inlineBookmark.style.display = 'none';
    var reward = clickValue(word.baseValue);
    state.money += reward;
    state.totalMoney += reward;

    addDictionaryWord(word.word);
    var skipIdx = state.skippedWords.indexOf(word.word);
    if (skipIdx >= 0) state.skippedWords.splice(skipIdx, 1);

    sfxOk();
    floatText('+$' + reward.toFixed(2), el.word);
    save();
    el.mic.classList.add('disabled');

    setTimeout(function() {
        el.wordArea.classList.remove('success');
        loadWord(true);
    }, 1600);
}

function onWrong(raw, matchRate) {
    el.wordArea.classList.add('fail');
    el.heard.textContent = '「' + raw + '」→ もう一度お試しください';
    el.ipa.innerHTML = highlightIpaError(word.ipa, word.word, raw);
    
    if (matchRate >= 0.4) {
        var effortBonus = clickValue(word.baseValue) * 0.15;
        state.money += effortBonus;
        state.totalMoney += effortBonus;
        floatText('+' + fmt(effortBonus) + ' (努力賞)', el.word);
        save();
        refreshUI();
    }
    
    sfxFail();
    setTimeout(function() { el.wordArea.classList.remove('fail'); }, 900);
}

function doSkip() {
    if (!skipped) {
        skipped = true;
        combo = 0;
        updateComboUI();
        if (listening && recognition) recognition.stop();
        el.meaningBox.hidden = false;
        el.meaningText.innerHTML = posBadgeHtml(word.pos) + word.meaning;

        el.inlineBookmark.style.display = 'inline-block';
        if (state.bookmarks.indexOf(word.word) >= 0) {
            el.inlineBookmark.classList.add('active');
        } else {
            el.inlineBookmark.classList.remove('active');
        }

        el.skip.textContent = '→ 次へ';
        el.heard.textContent = 'スキップしました';
        el.mic.classList.add('disabled');
        
        if (state.dictionary.indexOf(word.word) < 0 && state.skippedWords.indexOf(word.word) < 0) {
            state.skippedWords.push(word.word);
            save();
            renderDict();
        }

        speak(word.word);
        sfxFail();
    } else {
        loadWord(true);
    }
}

// 施設・強化
function openBuyModal(id, type) {
    type = type || 'fac';
    var item = (type === 'upg') ? UPGRADES[id] : FACILITIES[id];
    var cost = (type === 'upg') ? upgCost(id) : facCost(id);
    if (state.money < cost) { toast('資金不足', '所持金が足りません', 'bad'); return; }

    var isFirst = false;
    if (type === 'upg') {
        if (state.upgrades[id] >= item.max) return;
        isFirst = (state.upgrades[id] === 0);
    } else {
        isFirst = (state.facilities[id] === 0);
    }

    var targetEn, targetJp, targetIpa, dictWordData = null;

    $('modal-title').textContent = (type === 'upg') ? '強化の購入確認' : '施設の購入確認';
    $('modal-desc-text').textContent = '表示された単語を発音して購入を確定してください';

    if (type === 'fac' && isFirst) {
        targetEn = item.en;
        targetJp = item.jp;
        targetIpa = item.ipa;
    } else {
        var unseen = wordDatabase.filter(function(w) { return state.dictionary.indexOf(w.word) < 0; });
        var pool = unseen.length ? unseen : wordDatabase;
        dictWordData = pool[Math.floor(Math.random() * pool.length)];
        targetEn = dictWordData.word;
        var itemName = (type === 'upg') ? item.name : item.jp;
        targetJp = dictWordData.meaning + ' (' + itemName + ' 購入)';
        targetIpa = dictWordData.ipa;
    }

    var itemNameForToast = (type === 'upg') ? item.name : item.jp;
    buying = { id: id, type: type, en: targetEn, jp: targetJp, cost: cost, dictWordData: dictWordData, originalFacName: itemNameForToast };
    
    el.modalNameJp.textContent = targetJp;
    el.modalNameEn.textContent = targetEn;
    el.modalIpa.textContent = targetIpa;
    el.modalHeard.textContent = micOn ? '聞き取り中...' : '音声入力待ち';
    el.modalAccuracyBadge.hidden = true;
    if (el.modalTextInput) el.modalTextInput.value = '';
    el.modal.hidden = false;

    if (listening && recognition) recognition.stop();
    micMode = 'modal';

    if (micOn) {
        setTimeout(function() {
            if (micOn && !listening && buying) {
                try { recognition.start(); } catch(e) {}
            }
        }, 350);
    }
    updateMicUI();
}

function confirmBuy() {
    if (!buying) return;
    state.money -= buying.cost;

    var isGoalPurchase = false;
    if (buying.type === 'upg') {
        state.upgrades[buying.id]++;
        if (buying.id === 'radar') loadWord();
    } else {
        state.facilities[buying.id]++;
        if (buying.id === 'galactic' && state.facilities.galactic === 1) isGoalPurchase = true;
    }

    sfxBuy();
    purchasePulse();

    var msg = buying.originalFacName;
    toast('購入完了', msg + ' を購入しました', 'ok');
    floatText((buying.type === 'upg' ? '⚡ ' : '🏢 ') + msg, el.money);

    if (buying.dictWordData) {
        addDictionaryWord(buying.dictWordData.word);
    }

    closeModal();
    save();
    renderTimer = 0;
    refreshUI();
    checkAchievements();

    if (isGoalPurchase) showGoalCelebration();
}

// 経済ゴール（最終施設）到達演出
function showGoalCelebration() {
    el.goalTotalMoney.textContent = fmt(state.totalMoney);
    el.goalDictCount.textContent = state.dictionary.length + ' / ' + wordDatabase.length;
    el.modalGoal.hidden = false;
    sfxOk();
}

function closeModal() {
    el.modal.hidden = true;
    buying = null;
    practiceMode = false;
    micMode = 'word';
    if (listening && recognition) recognition.stop();
    if (micOn) {
        setTimeout(function() {
            if (micOn && !listening && !buying && !practiceMode) {
                try { recognition.start(); } catch(e) {}
            }
        }, 350);
    }
    updateMicUI();
}

function openPracticeModal(wordStr) {
    var existing = wordDatabase.find(function(w) { return w.word === wordStr; });
    if (!existing) return;

    practiceMode = true;
    buying = null;

    $('modal-title').textContent = '発音練習';
    $('modal-desc-text').textContent = 'マイクボタンを押して発音してください';
    
    el.modalNameJp.textContent = existing.meaning;
    el.modalNameEn.textContent = existing.word;
    el.modalIpa.textContent = existing.ipa;
    el.modalHeard.textContent = micOn ? '聞き取り中...' : '音声入力待ち';
    el.modalAccuracyBadge.hidden = true;
    if (el.modalTextInput) el.modalTextInput.value = '';
    el.modal.hidden = false;

    if (listening && recognition) recognition.stop();
    micMode = 'modal';

    if (micOn) {
        setTimeout(function() {
            if (micOn && !listening && practiceMode) {
                try { recognition.start(); } catch(e) {}
            }
        }, 350);
    }
    updateMicUI();
}

// 描画
function refreshUI() {
    el.money.textContent = fmt(state.money).replace('$', '');
    el.dps.textContent = fmt(dpsValue());
    el.bonus.textContent = '+' + (dictBonus() * 100).toFixed(0) + '%';
    el.totalMoney.textContent = fmt(state.totalMoney);

    var total = wordDatabase.length;
    var got = state.dictionary.length;
    el.dictProgress.textContent = got + '/' + total;

    if (word && !skipped) {
        el.reward.textContent = '+' + fmt(clickValue(word.baseValue));
    }

    var now = Date.now();
    if (now - renderTimer > 800) {
        renderTimer = now;
        renderFacilities();
        renderUpgrades();
    }

    var remain = 5 - ((got % 5) || 5);
    el.dictCount.textContent = got;
    el.dictTotal.textContent = total;
    el.dictBar.style.width = (got / total * 100) + '%';
    
    if (got >= total) {
        el.dictMilestone.textContent = '🎉 図鑑コンプリート！ 🎉';
        el.dictMilestone.style.color = 'var(--accent)';
    } else if (got + remain > total) {
        el.dictMilestone.textContent = 'あと' + (total - got) + '語で図鑑コンプリート！';
        el.dictMilestone.style.color = '';
    } else {
        el.dictMilestone.textContent = '次のボーナス(+' + (3 + state.upgrades.dictBonus) + '%)まであと' + remain + '語';
        el.dictMilestone.style.color = '';
    }
}

var lastFacHtml = '';
function renderFacilities() {
    var html = '';
    for (var id in FACILITIES) {
        var f = FACILITIES[id];
        var n = state.facilities[id];
        var cost = facCost(id);
        var rate = f.dps * (1 + dictBonus()) * (1 + state.upgrades.autoBoost * 0.10);
        var locked = state.totalMoney < f.base * 0.6;
        var afford = state.money >= cost;

        if (locked) {
            html += '<div class="fac-card locked">'
                + '<div class="fac-info"><div class="fac-name">？？？</div>'
                + '<div class="fac-sub">総獲得額 ' + fmt(f.base * 0.6) + ' で解放</div></div>'
                + '<div class="fac-right"><button class="btn-buy" disabled><span>購入</span><span class="cost">???</span></button></div></div>';
        } else {
            var affordClass = afford ? 'affordable' : 'unaffordable';
            var totalFacDps = rate * n;
            var totalDpsHtml = n > 0 ? ' <span style="color:var(--text-dim);font-size:10px;margin-left:6px;">(計: +' + fmt(totalFacDps) + '/秒)</span>' : '';
            html += '<div class="fac-card ' + affordClass + '">'
                + '<div class="fac-info"><div class="fac-name">' + f.jp + ' <span style="color:var(--text-faint);font-size:11px;font-weight:400">' + f.en + '</span></div>'
                + '<div class="fac-sub">生産: <em>+' + fmt(rate) + '/秒</em>' + totalDpsHtml + '</div></div>'
                + '<div class="fac-right"><span class="fac-count">' + n + '</span>'
                + '<button class="btn-buy" ' + (afford ? '' : 'disabled') + ' data-fac="' + id + '">'
                + '<span>購入</span><span class="cost">' + fmt(cost) + '</span></button></div></div>';
        }
    }
    if (lastFacHtml !== html) {
        lastFacHtml = html;
        el.facilities.innerHTML = html;
    }
}

var lastUpgHtml = '';
function renderUpgrades() {
    var icons = { vocal: '🎤', radar: '📡', dictBonus: '📖', autoBoost: '⚡' };
    var colors = { vocal: 'var(--accent-dim)', radar: 'var(--purple-dim)', dictBonus: 'var(--blue-dim)', autoBoost: 'var(--green-dim)' };
    var html = '';
    for (var id in UPGRADES) {
        var u = UPGRADES[id];
        var lv = state.upgrades[id];
        var cost = upgCost(id);
        var maxed = lv >= u.max;
        var afford = state.money >= cost && !maxed;
        var affordClass = afford ? 'affordable' : (maxed ? '' : 'unaffordable');

        html += '<div class="upg-card ' + affordClass + '">'
            + '<div class="upg-icon" style="background:' + colors[id] + '">' + icons[id] + '</div>'
            + '<div class="upg-info"><div class="upg-name">' + u.name + ' <span class="upg-lv">Lv.' + lv + '</span></div>'
            + '<div class="upg-desc">' + u.desc + '</div></div>'
            + '<button class="btn-buy" ' + (afford ? '' : 'disabled') + ' data-upg="' + id + '">'
            + '<span>' + (maxed ? '最大' : '強化') + '</span>'
            + '<span class="cost">' + (maxed ? 'MAX' : fmt(cost)) + '</span></button></div>';
    }
    if (lastUpgHtml !== html) {
        lastUpgHtml = html;
        el.upgrades.innerHTML = html;
    }
}

function renderDict() {
    var html = '';
    var unlockedOnly = el.dictUnlockedOnly.checked;
    
    var posFilters = [];
    document.querySelectorAll('.pos-filter').forEach(function(cb) {
        if (cb.checked) posFilters.push(cb.value);
    });

    var words = wordDatabase.filter(function(w) {
        if (posFilters.indexOf(w.pos || '名') < 0) return false;
        
        if (dictFilter === 'bookmark') return state.bookmarks.indexOf(w.word) >= 0;
        if (dictFilter === 'skipped') return state.skippedWords.indexOf(w.word) >= 0;
        return dictFilter === 'all' || w.level.toString() === dictFilter;
    });

    words.forEach(function(w) {
        var got = state.dictionary.indexOf(w.word) >= 0;
        var isSkipped = state.skippedWords.indexOf(w.word) >= 0;
        var bookmarked = state.bookmarks.indexOf(w.word) >= 0;
        
        if (unlockedOnly && !got && !isSkipped) return;
        
        if (got || isSkipped) {
            var itemClass = got ? 'unlocked' : 'skipped';
            var forgetBtn = isSkipped
                ? '<button class="dict-btn dict-forget" data-word="' + w.word + '" title="復習リストから外す" aria-label="復習リストから外す">🗑</button>'
                : '';
            html += '<div class="dict-item ' + itemClass + '">'
                + '<div><div class="dict-word">' + w.word + '</div>'
                + '<div class="dict-ipa">' + w.ipa + '</div>'
                + '<div class="dict-meaning">' + posBadgeHtml(w.pos) + w.meaning + '</div></div>'
                + '<div class="dict-actions">'
                + '<button class="dict-btn dict-bookmark ' + (bookmarked ? 'active' : '') + '" data-word="' + w.word + '" title="ブックマーク登録 / 解除" aria-label="ブックマーク登録 / 解除">★</button>'
                + '<button class="dict-btn dict-practice" data-practice="' + w.word + '" title="発音を練習する" aria-label="発音を練習する">🎤</button>'
                + '<button class="dict-btn dict-play" data-speak="' + w.word + '" title="お手本を聞く" aria-label="お手本を聞く">🔊</button>'
                + forgetBtn
                + '</div></div>';
        } else {
            html += '<div class="dict-item locked"><span class="lock-label">？？？</span></div>';
        }
    });

    el.dictGrid.innerHTML = html;
}

function renderAchievements() {
    var html = '';
    var unlockedCount = 0;
    ACHIEVEMENTS.forEach(function(a) {
        var unlocked = state.unlockedAchievements.indexOf(a.id) >= 0;
        if (unlocked) unlockedCount++;
        var itemClass = unlocked ? 'unlocked' : 'achv-pending';
        var nameDisplay = unlocked ? a.name : '？？？';
        html += '<div class="dict-item ' + itemClass + '">'
            + '<div><div class="dict-word">' + a.icon + ' ' + nameDisplay + '</div>'
            + '<div class="dict-meaning">' + a.desc + '</div></div></div>';
    });
    el.achvGrid.innerHTML = html;
    el.achvCount.textContent = unlockedCount;
    el.achvTotal.textContent = ACHIEVEMENTS.length;
    el.statTotalCorrect.textContent = state.stats.totalCorrect;
    el.statBestCombo.textContent = state.stats.bestCombo;
}

// UI演出
function purchasePulse() {
    var m = document.querySelector('.money-display');
    m.classList.remove('purchase-pulse');
    void m.offsetWidth; // アニメーション再トリガー
    m.classList.add('purchase-pulse');
}

function floatText(text, anchor) {
    var r = anchor.getBoundingClientRect();
    var d = document.createElement('div');
    d.className = 'float-text';
    d.textContent = text;
    d.style.left = (r.left + r.width / 2 + (Math.random() * 16 - 8)) + 'px';
    d.style.top = (r.top - 8) + 'px';
    el.floats.appendChild(d);
    setTimeout(function() { d.remove(); }, 900);
}

function toast(title, msg, type) {
    var d = document.createElement('div');
    d.className = 'toast ' + (type || 'ok');
    d.innerHTML = '<div class="toast-body"><span class="toast-title">' + title + '</span><span class="toast-msg">' + msg + '</span></div>';
    el.toasts.appendChild(d);
    setTimeout(function() { d.classList.add('show'); }, 10);
    setTimeout(function() {
        d.classList.remove('show');
        setTimeout(function() { d.remove(); }, 350);
    }, 3000);
}

// ゲームループ
var lastTick = Date.now();
function tick() {
    var now = Date.now();
    var dt = (now - lastTick) / 1000;
    lastTick = now;

    var d = dpsValue();
    if (d > 0) {
        state.money += d * dt;
        state.totalMoney += d * dt;
    }
    refreshUI();
    requestAnimationFrame(tick);
}

// セーブ・ロード
function save() {
    localStorage.setItem('pronTycoon', JSON.stringify(state));
}

function load() {
    var s = localStorage.getItem('pronTycoon');
    if (!s) return;
    try {
        var p = JSON.parse(s);
        state.money = p.money || 0;
        state.totalMoney = p.totalMoney || 0;
        state.currentWord = p.currentWord || null;
        state.bookmarks = Array.isArray(p.bookmarks) ? p.bookmarks : [];
        state.dictionary = Array.isArray(p.dictionary) ? p.dictionary : [];
        state.skippedWords = Array.isArray(p.skippedWords) ? p.skippedWords : [];
        state.unlockedAchievements = Array.isArray(p.unlockedAchievements) ? p.unlockedAchievements : [];
        state.lastSeenAchvCount = p.lastSeenAchvCount || 0;
        state.stats = {
            bestCombo: (p.stats && p.stats.bestCombo) || 0,
            totalCorrect: (p.stats && p.stats.totalCorrect) || 0
        };
        if (p.upgrades) {
            for (var k in state.upgrades) {
                if (k in p.upgrades) state.upgrades[k] = p.upgrades[k];
            }
        }
        if (p.facilities) {
            for (var k in state.facilities) {
                if (k in p.facilities) state.facilities[k] = p.facilities[k];
            }
        }
        state.difficulty = p.difficulty || 'normal';
        state.volume = p.volume !== undefined ? p.volume : 1.0;
        state.slowMode = !!p.slowMode;
        state.theme = p.theme === 'dark' ? 'dark' : 'light';
        toast('ロード完了', '前回のデータを復元しました', 'ok');
    } catch(e) {}
}

function resetGame() {
    localStorage.removeItem('pronTycoon');
    state = {
        money: 0, totalMoney: 0,
        upgrades: { vocal: 0, radar: 0, dictBonus: 0, autoBoost: 0 },
        facilities: { 
            blocks: 0, ebook: 0, cram: 0, ai: 0, academy: 0, lab: 0, satellite: 0,
            neural: 0, orbital: 0, lunar: 0, dyson: 0, galactic: 0
        },
        dictionary: [],
        skippedWords: [],
        bookmarks: [],
        unlockedAchievements: [],
        lastSeenAchvCount: 0,
        stats: { bestCombo: 0, totalCorrect: 0 },
        currentWord: null,
        difficulty: 'normal',
        volume: 1.0,
        slowMode: false,
        theme: 'light'
    };
    micOn = false;
    combo = 0;
    updateComboUI();
    applyTheme();
    updateAchvTabBadge();
    if (listening && recognition) recognition.stop();
    updateMicUI();
    toast('リセット完了', 'データを初期化しました', 'bad');
    loadWord();
    renderDict();
    refreshUI();
    el.settingsOverlay.hidden = true;
}

// イベント
function bindEvents() {
    // 初回クリック時にオーディオを有効化する
    document.body.addEventListener('click', function() {
        initAudio();
    }, { once: true });

    document.querySelectorAll('input[name="diff"]').forEach(function(r) {
        if (r.value === state.difficulty) r.checked = true;
        r.addEventListener('change', function(e) {
            state.difficulty = e.target.value;
            save();
            refreshUI();
            if (word) el.reward.textContent = '+' + fmt(clickValue(word.baseValue));
        });
    });

    // 設定
    el.btnSettings.addEventListener('click', function() {
        el.settingsOverlay.hidden = false;
        el.volumeSlider.value = state.volume;
        el.slowModeToggle.checked = state.slowMode;
        el.themeToggle.checked = state.theme === 'dark';
    });

    el.themeToggle.addEventListener('change', function(e) {
        state.theme = e.target.checked ? 'dark' : 'light';
        applyTheme();
        save();
    });
    el.settingsClose.addEventListener('click', function() {
        el.settingsOverlay.hidden = true;
    });
    el.settingsOverlay.addEventListener('click', function(e) {
        if (e.target === el.settingsOverlay) el.settingsOverlay.hidden = true;
    });

    // ヘルプ
    el.btnHelp.addEventListener('click', function() {
        el.modalHelp.hidden = false;
    });
    el.modalHelpClose.addEventListener('click', function() {
        el.modalHelp.hidden = true;
    });
    el.modalHelp.addEventListener('click', function(e) {
        if (e.target === el.modalHelp) el.modalHelp.hidden = true;
    });

    // 経済ゴール到達モーダル
    el.modalGoalClose.addEventListener('click', function() {
        el.modalGoal.hidden = true;
    });
    el.modalGoal.addEventListener('click', function(e) {
        if (e.target === el.modalGoal) el.modalGoal.hidden = true;
    });

    el.volumeSlider.addEventListener('input', function(e) {
        state.volume = parseFloat(e.target.value);
        save();
    });
    
    if (el.voiceSelect) {
        el.voiceSelect.addEventListener('change', function(e) {
            state.voiceURI = e.target.value;
            save();
            loadVoice();
            // テスト再生
            speak('Testing voice');
        });
    }

    el.slowModeToggle.addEventListener('change', function(e) {
        state.slowMode = e.target.checked;
        save();
    });

    el.mic.addEventListener('click', function() { initAudio(); toggleMic(); });
    el.listen.addEventListener('click', function() { initAudio(); if (word) speak(word.word); });
    el.skip.addEventListener('click', function() { initAudio(); doSkip(); });

    el.inlineBookmark.addEventListener('click', function() {
        initAudio();
        if (!word) return;
        var idx = state.bookmarks.indexOf(word.word);
        if (idx >= 0) {
            state.bookmarks.splice(idx, 1);
            el.inlineBookmark.classList.remove('active');
            toast('ブックマーク解除', '「' + word.word + '」を解除しました', 'info');
        } else {
            state.bookmarks.push(word.word);
            el.inlineBookmark.classList.add('active');
            toast('ブックマーク登録', '「' + word.word + '」を登録しました', 'ok');
        }
        save();
        renderDict();
        checkAchievements();
    });

    el.textSubmit.addEventListener('click', function() {
        var t = el.textInput.value.trim();
        if (t) { micMode = 'word'; onHeard(t); el.textInput.value = ''; }
    });
    el.textInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') el.textSubmit.click();
    });

    el.reset.addEventListener('click', function() {
        el.modalConfirmReset.hidden = false;
    });
    el.confirmResetYes.addEventListener('click', function() {
        el.modalConfirmReset.hidden = true;
        resetGame();
    });
    el.confirmResetCancel.addEventListener('click', function() {
        el.modalConfirmReset.hidden = true;
    });
    el.modalConfirmReset.addEventListener('click', function(e) {
        if (e.target === el.modalConfirmReset) el.modalConfirmReset.hidden = true;
    });

    // モーダル
    el.modalMic.addEventListener('click', function() { initAudio(); toggleMic(); });
    el.modalListen.addEventListener('click', function() {
        initAudio();
        if (buying) speak(buying.en);
        else if (practiceMode) speak(el.modalNameEn.textContent);
    });
    el.modalClose.addEventListener('click', closeModal);
    el.modalCancel.addEventListener('click', closeModal);
    el.modal.addEventListener('click', function(e) {
        if (e.target === el.modal) closeModal();
    });
    el.modalTextSubmit.addEventListener('click', function() {
        var t = el.modalTextInput.value.trim();
        if (t) { micMode = 'modal'; onHeard(t); el.modalTextInput.value = ''; }
    });
    el.modalTextInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') el.modalTextSubmit.click();
    });
    window.addEventListener('keydown', function(e) {
        var tag = document.activeElement && document.activeElement.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;

        if (e.code === 'Space') {
            e.preventDefault();
            initAudio();
            if (!el.modal.hidden) el.modalMic.click();
            else el.mic.click();
        } else if (e.key === 'l' || e.key === 'L') {
            initAudio();
            if (!el.modal.hidden) el.modalListen.click();
            else el.listen.click();
        } else if (e.key === 's' || e.key === 'S') {
            if (el.modal.hidden) { initAudio(); el.skip.click(); }
        }
    });

    el.rewardInfoBtn.addEventListener('click', function() {
        var willShow = el.rewardInfoText.hidden;
        el.rewardInfoText.hidden = !willShow;
        el.rewardInfoBtn.setAttribute('aria-expanded', String(willShow));
    });

    // ショップのクイックナビ（施設↔強化へジャンプ）
    document.querySelectorAll('.shop-quicknav-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var target = document.getElementById(btn.dataset.jump);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // タブ切替
    document.querySelectorAll('.tab').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab').forEach(function(b) { b.classList.remove('active'); });
            document.querySelectorAll('.tab-body').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            var target = document.getElementById('tab-' + btn.dataset.tab);
            if (target) target.classList.add('active');
            if (btn.dataset.tab === 'dictionary') renderDict();
            if (btn.dataset.tab === 'achievements') {
                renderAchievements();
                state.lastSeenAchvCount = state.unlockedAchievements.length;
                save();
                updateAchvTabBadge();
            }
        });
    });

    // 施設・強化のイベント委譲
    el.facilities.addEventListener('click', function(e) {
        var btn = e.target.closest('.btn-buy');
        if (!btn || btn.disabled) return;
        var id = btn.dataset.fac;
        if (id) { initAudio(); openBuyModal(id, 'fac'); }
    });

    el.upgrades.addEventListener('click', function(e) {
        var btn = e.target.closest('.btn-buy');
        if (!btn || btn.disabled) return;
        var id = btn.dataset.upg;
        if (id) { initAudio(); openBuyModal(id, 'upg'); }
    });

    // 図鑑フィルター
    el.dictFiltersWrap.addEventListener('click', function(e) {
        if (!e.target.classList.contains('filter')) return;
        el.dictFiltersWrap.querySelectorAll('.filter').forEach(function(b) { b.classList.remove('active'); });
        e.target.classList.add('active');
        dictFilter = e.target.dataset.level;
        renderDict();
    });

    el.dictUnlockedOnly.addEventListener('change', renderDict);
    document.querySelectorAll('.pos-filter').forEach(function(cb) {
        cb.addEventListener('change', renderDict);
    });

    // 図鑑の発音アクション
    el.dictGrid.addEventListener('click', function(e) {
        var btn = e.target.closest('.dict-btn');
        if (!btn) return;
        var w = btn.dataset.word || btn.dataset.practice || btn.dataset.speak;
        
        if (btn.classList.contains('dict-play')) {
            initAudio(); speak(w);
        } else if (btn.classList.contains('dict-bookmark')) {
            initAudio();
            var idx = state.bookmarks.indexOf(w);
            if (idx >= 0) {
                state.bookmarks.splice(idx, 1);
                toast('ブックマーク解除', '「' + w + '」を解除しました', 'info');
            } else {
                state.bookmarks.push(w);
                toast('ブックマーク登録', '「' + w + '」を登録しました', 'ok');
            }
            save();
            renderDict();
            checkAchievements();
        } else if (btn.classList.contains('dict-practice')) {
            initAudio();
            openPracticeModal(w);
        } else if (btn.classList.contains('dict-forget')) {
            initAudio();
            var skipIdx = state.skippedWords.indexOf(w);
            if (skipIdx >= 0) {
                state.skippedWords.splice(skipIdx, 1);
                toast('復習リスト解除', '「' + w + '」を復習リストから外しました', 'info');
                save();
                renderDict();
            }
        }
    });

    // 自動セーブ
    setInterval(save, 10000);
}

// デモデータ（審査用）: URLに ?demo=mid（中盤） / ?demo=end（終盤直前）を付けると
// 進行済みのセーブデータを読み込む。既存のセーブは上書きされる。
function applyDemoState() {
    var demo = new URLSearchParams(location.search).get('demo');
    if (demo !== 'mid' && demo !== 'end') return false;
    var presets = {
        mid: { money: 3.2e8, totalMoney: 9e8, dictCount: 150, bookmarkCount: 6,
               facilities: { blocks: 12, ebook: 10, cram: 8, ai: 6, lab: 3, academy: 1 },
               upgrades: { vocal: 12, radar: 1, dictBonus: 2, autoBoost: 6 },
               stats: { bestCombo: 27, totalCorrect: 168 },
               achievements: ['first_word', 'combo10', 'combo25', 'dict50'] },
        end: { money: 8.6e18, totalMoney: 3.1e19, dictCount: 480, bookmarkCount: 12,
               facilities: { blocks: 80, ebook: 79, cram: 79, ai: 78, lab: 68, academy: 58,
                             satellite: 48, neural: 40, orbital: 30, lunar: 22, dyson: 14 },
               upgrades: { vocal: 60, radar: 5, dictBonus: 8, autoBoost: 40 },
               stats: { bestCombo: 41, totalCorrect: 720 },
               achievements: ['first_word', 'combo10', 'combo25', 'dict50', 'dict200', 'bookmark10'] }
    };
    var p = presets[demo];
    state.money = p.money;
    state.totalMoney = p.totalMoney;
    var k;
    for (k in state.facilities) state.facilities[k] = p.facilities[k] || 0;
    for (k in state.upgrades) state.upgrades[k] = p.upgrades[k] || 0;
    state.dictionary = wordDatabase.slice(0, p.dictCount).map(function(w) { return w.word; });
    state.bookmarks = wordDatabase.slice(0, p.bookmarkCount).map(function(w) { return w.word; });
    state.skippedWords = wordDatabase.slice(p.dictCount, p.dictCount + 3).map(function(w) { return w.word; });
    state.stats = { bestCombo: p.stats.bestCombo, totalCorrect: p.stats.totalCorrect };
    state.unlockedAchievements = p.achievements.slice();
    state.lastSeenAchvCount = p.achievements.length;
    state.currentWord = null;
    save();
    toast('デモデータ', (demo === 'mid' ? '中盤' : '終盤直前') + 'の状態を読み込みました', 'info');
    return true;
}

// 起動
window.addEventListener('DOMContentLoaded', function() {
    var isFirstTime = !localStorage.getItem('pronTycoon');
    load();
    var demoApplied = applyDemoState();
    applyTheme();
    bindEvents();
    loadWord();
    renderDict();
    checkAchievements();
    lastTick = Date.now();
    requestAnimationFrame(tick);
    if (window.speechSynthesis) {
        loadVoice();
        speechSynthesis.addEventListener('voiceschanged', loadVoice);
    }
    if (isFirstTime && !demoApplied) el.modalHelp.hidden = false;
});
