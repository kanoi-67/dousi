// 中学校で学習する主要な不規則動詞リスト (変更なし)
const ALL_VERB_SETS = [
    ["be", "was/were", "been"], 
    ["become", "became", "become"],
    ["begin", "began", "begun"],
    ["break", "broke", "broken"],
    ["bring", "brought", "brought"],
    ["buy", "bought", "bought"],
    ["come", "came", "come"],
    ["cut", "cut", "cut"],
    ["do", "did", "done"],
    ["draw", "drew", "drawn"],
    ["drink", "drank", "drunk"],
    ["drive", "drove", "driven"],
    ["eat", "ate", "eaten"],
    ["fall", "fell", "fallen"],
    ["feel", "felt", "felt"],
    ["find", "found", "found"],
    ["fly", "flew", "flown"],
    ["get", "got", "gotten"],
    ["give", "gave", "given"],
    ["go", "went", "gone"],
    ["have", "had", "had"],
    ["hear", "heard", "heard"],
    ["keep", "kept", "kept"],
    ["know", "knew", "known"],
    ["leave", "left", "left"],
    ["make", "made", "made"],
    ["meet", "met", "met"],
    ["read", "read", "read"],
    ["run", "ran", "run"],
    ["say", "said", "said"],
    ["see", "saw", "seen"],
    ["send", "sent", "sent"],
    ["sing", "sang", "sung"],
    ["sleep", "slept", "slept"],
    ["speak", "spoke", "spoken"],
    ["stand", "stood", "stood"],
    ["swim", "swam", "swum"],
    ["take", "took", "taken"],
    ["tell", "told", "told"],
    ["think", "thought", "thought"],
    ["wear", "wore", "worn"],
    ["write", "wrote", "written"]
];

const TIME_LIMIT_SECONDS = 300; 

// DOM要素の取得
const grid = document.getElementById('puzzle-grid');
const message = document.getElementById('message');
const timerBox = document.getElementById('timer-box');
const scoreBox = document.getElementById('score-box');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const nextButton = document.getElementById('next-button');
const restartButton = document.getElementById('restart-button');

// ゲームの状態変数
let allVerbSetsCopy = [...ALL_VERB_SETS]; // 動詞リストのコピー
let currentVerbSet = [];
let allPieces = [];
let selectedPieces = [];
let correctSetsFound = 0; // 現在のパズルの正解数 (目標: 2)
let totalScore = 0;       // 累計正解数 (ゲーム全体のスコア)
let timerInterval;
let gameIsRunning = false;
let timeLeft = TIME_LIMIT_SECONDS;

// --- ユーティリティ関数 --- (変更なし)

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function generateDummyWord(baseWord) {
    if (!baseWord) return 'mistake';
    if (baseWord.endsWith('e')) return baseWord + 'd';
    if (baseWord.length > 3) return baseWord + 'ed';
    
    return baseWord.replace(/[aeiou]/g, function(vowel) {
        const vowels = ['a', 'e', 'i', 'o', 'u'];
        let newVowel = vowels[Math.floor(Math.random() * vowels.length)];
        return (newVowel === vowel) ? (vowels[(vowels.indexOf(vowel) + 1) % vowels.length]) : newVowel;
    });
}

const ENCOURAGEMENT_MESSAGES = [
    "🔥 いい調子！集中できてるね！",
    "👍 正解！どんどん進もう！",
    "🌟 その調子で次も頑張ろう！",
    "😊 落ち着いて、次の動詞をよく見て。",
    "💯 ナイス！記憶が定着してる証拠だよ！"
];

const FAILURE_MESSAGES = [
    "🙅‍♂️ もう一度確認してみよう！",
    "😟 惜しい！一つだけ違ったかも？",
    "💡 変化のパターンを思い出して！"
];


// --- タイマー関連の関数 ---

function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const remainingSeconds = timeLeft % 60;
    timerBox.textContent = `残り時間: ${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    
    if (timeLeft <= 60 && timeLeft > 0) {
        timerBox.classList.add('time-low');
    } else {
        timerBox.classList.remove('time-low');
    }
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimer();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endGame(); // タイムオーバーでゲーム終了
        }
    }, 1000);
}

// --- ゲームロジックの関数 ---

/**
 * ゲーム開始時に一度だけ呼ばれる関数
 */
function startGame() {
    startScreen.classList.add('hidden'); // スタート画面を隠す
    gameIsRunning = true;
    totalScore = 0;
    timeLeft = TIME_LIMIT_SECONDS;
    updateTimer();
    scoreBox.textContent = `正解数: ${totalScore} 問`;
    
    // パズルの準備
    initializePuzzle();
    
    // タイマー開始
    startTimer();
    
    // ボタン表示の切り替え
    nextButton.classList.add('hidden');
    restartButton.textContent = 'リスタート';
}

/**
 * 連続でパズルを初期化する関数
 */
function initializePuzzle() {
    grid.innerHTML = '';
    message.textContent = '原形 → 過去形 → 過去分詞のセットを2組見つけよう！';
    selectedPieces = [];
    allPieces = [];
    correctSetsFound = 0;
    
    grid.classList.remove('disabled');
    nextButton.classList.add('hidden'); // 次へボタンを隠す

    // 動詞セットが足りなくなったらシャッフルしてリセット
    if (allVerbSetsCopy.length < 2) {
        allVerbSetsCopy = [...ALL_VERB_SETS];
        shuffleArray(allVerbSetsCopy);
    }
    
    // 1. 全動詞リストからランダムに2セットを選択
    const setIndex1 = allVerbSetsCopy.pop();
    const setIndex2 = allVerbSetsCopy.pop();
    currentVerbSet = [setIndex1, setIndex2];

    // 2. 正解ピース 6つ (2セット x 3形) を作成
    let pieceIdCounter = 0;
    currentVerbSet.forEach((set, setIndex) => {
        set.forEach((verb, typeIndex) => {
            allPieces.push({ 
                word: verb, 
                correctOrder: typeIndex,
                isDummy: false,
                setIndex: setIndex,
                id: pieceIdCounter++
            });
        });
    });

    // 3. ダミーピース 3つ を作成
    for (let i = 0; i < 3; i++) {
        const baseWord = currentVerbSet[0][i]; 
        allPieces.push({
            word: generateDummyWord(baseWord),
            correctOrder: -1,
            isDummy: true,
            setIndex: -1,
            id: pieceIdCounter++
        });
    }

    shuffleArray(allPieces);

    allPieces.forEach(pieceData => {
        const piece = document.createElement('div');
        piece.classList.add('puzzle-piece');
        piece.textContent = pieceData.word;
        piece.dataset.id = pieceData.id;
        piece.addEventListener('click', () => handlePieceClick(piece, pieceData));
        grid.appendChild(piece);
    });
}

function handlePieceClick(piece, pieceData) {
    if (!gameIsRunning || piece.classList.contains('correct') || selectedPieces.includes(piece)) {
        return; 
    }

    piece.classList.add('selected');
    selectedPieces.push(piece);

    if (selectedPieces.length === 3) {
        checkCombination();
    }
}

function checkCombination() {
    const selectedData = selectedPieces.map(p => allPieces.find(d => d.id == p.dataset.id));
    
    const allNotDummy = selectedData.every(data => data.isDummy === false);
    const firstSetIndex = selectedData[0].setIndex;
    const sameSetIndex = selectedData.every(data => data.setIndex === firstSetIndex);
    const orders = selectedData.map(data => data.correctOrder).sort();
    const correctFormsCount = orders[0] === 0 && orders[1] === 1 && orders[2] === 2;

    const isCorrectSet = allNotDummy && sameSetIndex && correctFormsCount;

    if (isCorrectSet) {
        message.textContent = ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
        correctSetsFound++;
        totalScore++; // 全体のスコアをインクリメント
        scoreBox.textContent = `正解数: ${totalScore} 問`;

        selectedPieces.forEach(p => {
            p.classList.remove('selected');
            p.classList.add('correct');
        });
        
        if (correctSetsFound === 2) {
            // パズルクリア
            message.textContent = `🎉 2組正解！お見事！ 次のパズルへ進もう！`;
            grid.classList.add('disabled'); // ピース操作を一時無効化
            nextButton.classList.remove('hidden'); // 次へボタンを表示
        }
    } else {
        message.textContent = FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)];
    }

    // 処理後、選択をリセット
    setTimeout(() => {
        if (!isCorrectSet) {
            selectedPieces.forEach(p => p.classList.remove('selected'));
        }
        selectedPieces = [];
    }, 1000); 
}

function endGame() {
    clearInterval(timerInterval);
    gameIsRunning = false;
    grid.classList.add('disabled');
    timerBox.classList.remove('time-low');

    // 最終スコア表示
    message.innerHTML = `⏱️ **タイムオーバー！** ⏱️<br>あなたの記録は **${totalScore} 問** でした。`;
    timerBox.textContent = "ゲームオーバー";
    
    // ボタン表示の切り替え
    nextButton.classList.add('hidden');
    restartButton.textContent = 'もう一度チャレンジ！';
    startScreen.classList.remove('hidden'); // スタート画面を再表示（リスタート用）
    startScreen.querySelector('h2').textContent = `最終スコア: ${totalScore} 問！`;
    startScreen.querySelector('p').textContent = `もう一度挑戦して、ハイスコアを更新しよう！`;
}

// --- イベントリスナー ---

startButton.addEventListener('click', startGame);

nextButton.addEventListener('click', () => {
    grid.classList.remove('disabled');
    nextButton.classList.add('hidden');
    initializePuzzle();
});

restartButton.addEventListener('click', () => {
    // リスタートボタンはstartGameを呼び出すだけ (endGameがスタート画面を出すため)
    endGame(); // 現在のゲームを終了させて、リスタート画面を出す
});

// 初期表示: スタート画面を表示したまま、裏でパズルを一度だけ初期化（レイアウト表示のため）
initializePuzzle(); 
grid.classList.add('disabled'); // 初期状態ではピースを操作不能にする
updateTimer();
nextButton.classList.add('hidden');
restartButton.textContent = 'リスタート'; // ボタンのテキストを設定