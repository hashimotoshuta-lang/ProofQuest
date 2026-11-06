// ============================================================
// Proof Quest
// Stage Game Script
// ============================================================


// ============================================================
// ゲーム設定
// ============================================================

let MAX_HANDS = 6;


// ============================================================
// ゲーム状態
// ============================================================

let gameState = {

    remainingHands: 6,

    // 選択した通常カード
    selectedCards: [],

    // Stageで解放されたカード
    unlockedCards: [],

    // 正しい証拠がすべて集まったか
    evidenceComplete: false,

    // 合同条件カードが解放されたか
    conditionUnlocked: false,

    // 選択した合同条件
    selectedCondition: null,

    // ゲーム終了
    gameOver: false,

    // クリア
    cleared: false
};


// ============================================================
// URLからステージ番号・パート番号を取得
// ============================================================

const urlParams =
    new URLSearchParams(window.location.search);

const stageNumber =
    Number(urlParams.get("stage")) || 1;

const stagePart =
    Number(urlParams.get("part")) || 1;


// ============================================================
// Stageデータ
// ============================================================

let stageData = null;


// ============================================================
// 合同条件カード
// ============================================================

const CONDITION_CARDS = [

    {
        id: "sss",
        text: "3組の辺がそれぞれ等しい"
    },

    {
        id: "sas",
        text: "2組の辺とその間の角がそれぞれ等しい"
    },

    {
        id: "asa",
        text: "1組の辺とその両端の角がそれぞれ等しい"
    },

    {
        id: "rha",
        text: "直角三角形で斜辺と1つの鋭角がそれぞれ等しい"
    },

    {
        id: "rhs",
        text: "直角三角形で斜辺と他の1辺がそれぞれ等しい"
    }

];


// ============================================================
// DOM取得
// ============================================================

const titleElement =
    document.getElementById("stage-title");

const stageNumberElement =
    document.getElementById("stage-number");

const goalElement =
    document.getElementById("goal");

const handsElement =
    document.getElementById("remaining-hands");

const cardsContainer =
    document.getElementById("cards");

const messageElement =
    document.getElementById("message-text") ||
    document.getElementById("game-message");

const questStatusElement =
    document.getElementById("quest-status");

const resetButton =
    document.getElementById("reset-button");

const giveUpButton =
    document.getElementById("give-up-button");

const overlay =
    document.getElementById("overlay");

const overlayTitle =
    document.getElementById("overlay-title");

const overlayText =
    document.getElementById("overlay-text");

const overlayClose =
    document.getElementById("overlay-close");

const svgContainer =
    document.getElementById("svg-container");

const figureFactsList =
    document.getElementById("figure-facts-list");

const evidenceSlots =
    document.getElementById("evidence-slots");

const conditionDisplay =
    document.getElementById("condition-display");


// ============================================================
// Stageファイル名
// ============================================================
function getStageFileName(extension) {

    // =====================================================
    // Stage 3
    // stage03-1.json / stage03-2.json
    // stage03-1.svg / stage03-2.svg
    // =====================================================

    if (stageNumber === 3) {

        return (
            `stages/stage03-${stagePart}.${extension}`
        );

    }


    // =====================================================
    // 通常Stage
    // stage01.json
    // stage02.json
    // ...
    // =====================================================

    return (
        `stages/stage${String(stageNumber).padStart(2, "0")}.${extension}`
    );

}




// ============================================================
// Stageデータ読み込み
// ============================================================

async function loadStage() {

    try {

        const jsonPath =
            getStageFileName("json");

        console.log(
            "JSON読み込み:",
            jsonPath
        );


        const response =
            await fetch(jsonPath);


        if (!response.ok) {

            throw new Error(
                `Stage JSONを読み込めませんでした: ${jsonPath}`
            );

        }


        const loadedData =
            await response.json();


        stageData =
            loadedData;


        console.log(
            "Stage全体データ:",
            stageData
        );

        MAX_HANDS =
            stageData.maxHands || 6;


        initializeStage();


        await loadSVG();


    } catch (error) {

        console.error(
            "Stage読み込みエラー:",
            error
        );


        showMessage(
            "Stageデータの読み込みに失敗しました。"
        );

    }

}


// ============================================================
// Stage初期化
// ============================================================

function initializeStage() {

    gameState = {

        remainingHands: MAX_HANDS,

        selectedCards: [],

        unlockedCards: [],

        evidenceComplete: false,

        conditionUnlocked: false,

        selectedCondition: null,

        gameOver: false,

        cleared: false

    };


    // ----------------------------------------
    // body状態リセット
    // ----------------------------------------

    document.body.classList.remove(
        "stage-clear",
        "game-over"
    );


    // ----------------------------------------
    // タイトル
    // ----------------------------------------

    if (titleElement) {

        titleElement.textContent =
            stageData.title ||
            "Proof Quest";

    }


    // ----------------------------------------
    // Stage番号
    // ----------------------------------------

    if (stageNumberElement) {

        stageNumberElement.textContent =
            `STAGE ${String(
                stageData.stage || stageNumber
            ).padStart(2, "0")}`;

    }


    // ----------------------------------------
    // ゴール
    // ----------------------------------------

    if (goalElement) {

        goalElement.textContent =
            stageData.goal || "";

    }


    // ----------------------------------------
    // 合同条件
    // ----------------------------------------

    if (conditionDisplay) {

        conditionDisplay.textContent =
            "証拠をそろえよう";

    }


    // ----------------------------------------
    // 残り手数
    // ----------------------------------------

    updateHandsDisplay();


    // ----------------------------------------
    // 図形について
    // ----------------------------------------

    createFigureFacts();


    // ----------------------------------------
    // 証拠スロット
    // ----------------------------------------

    createEvidenceSlots();


    // ----------------------------------------
    // カード
    // ----------------------------------------

    createCards();


    // ----------------------------------------
    // メッセージ
    // ----------------------------------------

    if (stageNumber === 3) {

        if (stagePart === 1) {

            showMessage(
                "図形を観察して、最初の合同証明に必要な証拠を集めよう！"
            );

        } else {

            showMessage(
                "前の合同証明で得た証拠を手がかりに、次の合同を証明しよう！"
            );

        }

    } else {

        showMessage(
            "図形を観察して、証明に必要な証拠を選ぼう！"
        );

    }


    // ----------------------------------------
    // QUEST
    // ----------------------------------------

    updateQuestStatus();


    // ----------------------------------------
    // オーバーレイ
    // ----------------------------------------

    hideOverlay();


    // ----------------------------------------
    // リセットボタン
    // ----------------------------------------

    if (resetButton) {

        resetButton.style.display =
            "inline-flex";

        resetButton.textContent =
            "リセット";

    }

}


// ============================================================
// 図形情報を表示
// ============================================================

function createFigureFacts() {

    if (!figureFactsList) {
        return;
    }


    figureFactsList.innerHTML = "";


    if (!stageData.figureFacts) {
        return;
    }


    stageData.figureFacts.forEach(
        fact => {

            const item =
                document.createElement("div");


            item.className =
                "figure-fact";


            item.textContent =
                fact;


            figureFactsList.appendChild(
                item
            );

        }
    );

}


// ============================================================
// 証拠スロット生成
// ============================================================

function createEvidenceSlots() {

    if (!evidenceSlots) {
        return;
    }


    evidenceSlots.innerHTML = "";


    const correctCount =
        stageData.correctCombo
            ? stageData.correctCombo.length
            : 3;


    for (
        let i = 0;
        i < correctCount;
        i++
    ) {

        const slot =
            document.createElement("div");


        slot.className =
            "evidence-slot";


        slot.dataset.slot =
            i;


        slot.innerHTML = `

            <span class="slot-number">
                ${i + 1}
            </span>

            <span class="slot-placeholder">
                証拠を選ぶ
            </span>

        `;


        evidenceSlots.appendChild(
            slot
        );

    }

}


// ============================================================
// 証拠カード生成
// ============================================================

function createCards() {

    if (!cardsContainer) {
        return;
    }


    cardsContainer.innerHTML = "";


    const allCards = [];


    // ----------------------------------------
    // 正解カード
    // ----------------------------------------

    if (stageData.cards) {

        stageData.cards.forEach(
            card => {

                allCards.push({

                    ...card,

                    isCorrect: true,

                    isCondition: false

                });

            }
        );

    }


    // ----------------------------------------
    // ダミーカード
    // ----------------------------------------

    if (stageData.dummyCards) {

        stageData.dummyCards.forEach(
            card => {

                allCards.push({

                    ...card,

                    isCorrect: false,

                    isCondition: false

                });

            }
        );

    }


    // ----------------------------------------
    // シャッフル
    // ----------------------------------------

    shuffleArray(allCards);


    // ----------------------------------------
    // 通常カード
    // ----------------------------------------

    allCards.forEach(
        card => {

            createCardElement(
                card,
                cardsContainer
            );

        }
    );


    // ----------------------------------------
    // 合同条件カード
    // ----------------------------------------

    createConditionCards();

}


// ============================================================
// 通常カードDOM生成
// ============================================================

function createCardElement(
    card,
    container
) {

    const button =
        document.createElement("button");


    button.type =
        "button";


    button.className =
        "evidence-card";


    if (card.locked) {

        button.disabled = true;

        button.classList.add(
            "locked"
        );

        button.dataset.locked =
            "true";

    }


    button.dataset.cardId =
        card.id;


    button.dataset.cardType =
        card.type || "";


    button.innerHTML = `

        <div class="card-type">
            ${card.type || ""}
        </div>

        <div class="card-name">
            ${card.name || ""}
        </div>

        <div class="card-text">
            ${card.text || ""}
        </div>

    `;


    button.addEventListener(
        "click",
        () => {

            selectCard(
                card,
                button
            );

        }
    );


    container.appendChild(
        button
    );

}


// ============================================================
// 合同条件カード生成
// ============================================================

function createConditionCards() {

    const container =
        document.getElementById(
            "condition-cards"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const conditions =
        stageData.congruenceCards &&
        stageData.congruenceCards.length
            ? stageData.congruenceCards
            : CONDITION_CARDS;


    conditions.forEach(
        condition => {

            const button =
                document.createElement("button");


            button.type =
                "button";


            button.className =
                "condition-card";


            button.dataset.conditionId =
                condition.id;


            button.disabled =
                condition.locked === true ||
                !gameState.conditionUnlocked;


            button.innerHTML = `

                <span class="condition-card-icon">
                    ${condition.icon || "★"}
                </span>

                <span class="condition-card-text">
                    ${condition.text}
                </span>

            `;


            button.addEventListener(
                "click",
                () => {

                    selectCondition(
                        condition,
                        button
                    );

                }
            );


            container.appendChild(
                button
            );

        }
    );

}


// ============================================================
// 通常カード選択
// ============================================================

function selectCard(
    card,
    cardElement
) {

    if (
        gameState.gameOver ||
        gameState.cleared
    ) {
        return;
    }


    if (gameState.selectedCondition) {
        return;
    }


    if (
        gameState.selectedCards.includes(
            card.id
        )
    ) {
        return;
    }


    // ----------------------------------------
    // 手数消費
    // ----------------------------------------

    gameState.remainingHands--;

    updateHandsDisplay();


    // ----------------------------------------
    // 選択済み
    // ----------------------------------------

    gameState.selectedCards.push(
        card.id
    );


    cardElement.classList.add(
        "selected"
    );


    // ----------------------------------------
    // 正解
    // ----------------------------------------

    if (card.isCorrect) {

        cardElement.classList.add(
            "correct"
        );


        showMessage(
            "証拠を確保した！"
        );


        highlightCardEvidence(
            card
        );


        updateEvidenceSlots(
            card
        );


        // 正解カードを取得した直後に
        // アンロック条件を確認する
        checkUnlockRules();


        checkEvidenceComplete();

    }


    // ----------------------------------------
    // ダミー
    // ----------------------------------------

    else {

        cardElement.classList.add(
            "wrong"
        );


        showMessage(
            "他の証拠を見てみよう。"
        );

    }


    // ----------------------------------------
    // ゲームオーバー
    // ----------------------------------------

    if (
        !gameState.cleared &&
        gameState.remainingHands <= 0 &&
        !gameState.conditionUnlocked
    ) {

        gameOver();

    }

}


// ============================================================
// 証拠スロット更新
// ============================================================

function updateEvidenceSlots(card) {

    if (!evidenceSlots) {
        return;
    }


    if (!stageData.correctCombo) {
        return;
    }


    const selectedIndex =
        stageData.correctCombo.indexOf(
            card.id
        );


    if (selectedIndex === -1) {
        return;
    }


    const slots =
        evidenceSlots.querySelectorAll(
            ".evidence-slot"
        );


    const slot =
        slots[selectedIndex];


    if (!slot) {
        return;
    }


    slot.classList.add(
        "filled"
    );


    slot.innerHTML = `

        <span class="slot-number">
            ${selectedIndex + 1}
        </span>

        <span class="slot-card-name">
            ${card.text}
        </span>

    `;

}


// ============================================================
// Stage固有カードのアンロック判定
// ============================================================

function checkUnlockRules() {

    if (!stageData.unlockRules) {
        return;
    }


    stageData.unlockRules.forEach(
        rule => {

            if (
                gameState.unlockedCards.includes(
                    rule.unlockCard
                )
            ) {
                return;
            }


            const requirementsMet =
                rule.requiredCards.every(
                    cardId =>
                        gameState.selectedCards.includes(
                            cardId
                        )
                );


            if (!requirementsMet) {
                return;
            }


            gameState.unlockedCards.push(
                rule.unlockCard
            );


            const cardElement =
                document.querySelector(
                    `[data-card-id="${CSS.escape(rule.unlockCard)}"]`
                );


            if (!cardElement) {
                return;
            }


            cardElement.disabled =
                false;


            cardElement.classList.remove(
                "locked"
            );


            cardElement.classList.add(
                "unlocked"
            );


            cardElement.dataset.locked =
                "false";


            showMessage(
                "新しい証拠が解放された！"
            );

        }
    );

}


// ============================================================
// 証拠がすべてそろったか確認
// ============================================================

function checkEvidenceComplete() {

    if (
        !stageData.correctCombo ||
        !stageData.correctCombo.length
    ) {
        return;
    }


    const complete =
        stageData.correctCombo.every(
            id =>
                gameState.selectedCards.includes(
                    id
                )
        );


    if (!complete) {
        return;
    }


    if (gameState.conditionUnlocked) {
        return;
    }


    gameState.evidenceComplete =
        true;


    gameState.conditionUnlocked =
        true;


    unlockConditionCards();


    showMessage(
        "必要な証拠がそろった！　合同条件を選ぼう！"
    );


    updateQuestStatus();

}


// ============================================================
// 合同条件カード解放
// ============================================================

function unlockConditionCards() {

    const cards =
        document.querySelectorAll(
            ".condition-card"
        );


    cards.forEach(
        card => {

            card.disabled =
                false;


            card.classList.add(
                "unlocked"
            );

        }
    );


    const area =
        document.getElementById(
            "condition-card-area"
        );


    if (area) {

        area.classList.add(
            "unlocked"
        );

    }

}


// ============================================================
// 合同条件選択
// ============================================================

function selectCondition(
    condition,
    button
) {

    if (
        gameState.gameOver ||
        gameState.cleared
    ) {
        return;
    }


    if (!gameState.conditionUnlocked) {
        return;
    }


    // ----------------------------------------
    // 手数消費
    // ----------------------------------------

    gameState.remainingHands--;

    updateHandsDisplay();


    // ----------------------------------------
    // 正解判定
    // ----------------------------------------

    const correct =
        condition.id ===
        stageData.correctCongruenceCard;


    if (correct) {

        gameState.selectedCondition =
            condition.id;


        button.classList.add(
            "selected",
            "correct"
        );


        if (conditionDisplay) {

            conditionDisplay.textContent =
                condition.text;

        }


        showMessage(
            "合同が証明できた！"
        );


        // ====================================================
        // Stage03 Part 1
        // ====================================================

        if (
            stageNumber === 3 &&
            stagePart === 1
        ) {

            gameState.cleared =
                true;


            disableAllCards();


            document.body.classList.add(
                "stage-clear"
            );


            updateQuestStatus();


            showMessage(
                "1回目の合同証明が完成した！ 次の証明へ進もう！"
            );


            if (resetButton) {

                resetButton.textContent =
                    "もう一度挑戦";

                resetButton.style.display =
                    "inline-flex";

            }


            setTimeout(
                () => {

                    location.href =
                        "game.html?stage=3&part=2";

                },
                1200
            );


            return;

        }


        // ====================================================
        // Stage03 Part 2
        // または通常Stageのクリア
        // ====================================================

        gameState.cleared =
            true;


        disableAllCards();


        document.body.classList.add(
            "stage-clear"
        );


        updateQuestStatus();


        if (resetButton) {

            resetButton.textContent =
                "もう一度挑戦";

            resetButton.style.display =
                "inline-flex";

        }


        return;

    }


    // ----------------------------------------
    // 間違い
    // ----------------------------------------

    button.classList.add(
        "wrong"
    );


    showMessage(
        "この合同条件は違うようだ。"
    );


    gameState.selectedCondition =
        null;


    // ----------------------------------------
    // 手数チェック
    // ----------------------------------------

    if (
        !gameState.cleared &&
        gameState.remainingHands <= 0
    ) {

        gameOver();

    }

}


// ============================================================
// ゲームオーバー
// ============================================================

function gameOver() {

    if (gameState.cleared) {
        return;
    }


    gameState.gameOver =
        true;


    gameState.remainingHands =
        0;


    updateHandsDisplay();


    showMessage(
        "手数を使い切った……証明は完成しなかった。"
    );


    updateQuestStatus();


    disableAllCards();


    document.body.classList.add(
        "game-over"
    );


    showOverlay(
        "GAME OVER",
        "手数を使い切ってしまった。"
    );

}


// ============================================================
// 全カード操作停止
// ============================================================

function disableAllCards() {

    const cards =
        document.querySelectorAll(
            ".evidence-card, .condition-card"
        );


    cards.forEach(
        card => {

            card.disabled =
                true;

        }
    );

}


// ============================================================
// SVG読み込み
// ============================================================

async function loadSVG() {

    if (!svgContainer) {

        console.warn(
            "svg-container が見つかりません。"
        );

        return;

    }


    try {

        const svgPath =
            getStageFileName("svg");


        console.log(
            "SVG読み込み:",
            svgPath
        );


        const response =
            await fetch(svgPath);


        if (!response.ok) {

            throw new Error(
                `SVGを読み込めませんでした: ${svgPath} (${response.status})`
            );

        }


        const svgText =
            await response.text();


        if (!svgText.trim()) {

            throw new Error(
                "SVGファイルが空です。"
            );

        }


        svgContainer.innerHTML =
            svgText;


        console.log(
            "SVG読み込み成功:",
            svgPath
        );


        resetSVGHighlights();


    } catch (error) {

        console.error(
            "SVG読み込みエラー:",
            error
        );


        svgContainer.innerHTML = `

            <div class="svg-error">

                図形を読み込めませんでした。

                <br>

                <small>
                    ${getStageFileName("svg")}
                </small>

            </div>

        `;

    }

}


// ============================================================
// SVGハイライト
// ============================================================

function highlightCardEvidence(card) {

    if (!card.highlight) {
        return;
    }


    if (
        !Array.isArray(card.highlight)
    ) {
        return;
    }


    card.highlight.forEach(
        item => {

            if (
                typeof item === "string"
            ) {

                highlightSVGElement(
                    item
                );

                return;

            }


            if (
                typeof item === "object" &&
                item !== null
            ) {

                if (
                    item.type === "line"
                ) {

                    highlightSVGElement(
                        item.id
                    );

                }


                else if (
                    item.type === "angle"
                ) {

                    highlightAngle(
                        item
                    );

                }

            }

        }
    );

}


// ============================================================
// SVG要素ハイライト
// ============================================================

function highlightSVGElement(id) {

    if (!id) {
        return;
    }


    const svgElement =
        svgContainer
            ? svgContainer.querySelector(
                `#${CSS.escape(id)}`
            )
            : null;


    if (!svgElement) {

        console.warn(
            `SVG element not found: ${id}`
        );

        return;

    }


    svgElement.classList.add(
        "highlight"
    );

}


// ============================================================
// 角ハイライト
// ============================================================

function highlightAngle(angleData) {

    if (!angleData) {
        return;
    }


    if (angleData.id) {

        highlightSVGElement(
            angleData.id
        );

        return;

    }


    if (
        Array.isArray(angleData.points)
    ) {

        const angleId =
            "angle_" +
            angleData.points.join("");


        highlightSVGElement(
            angleId
        );

    }

}


// ============================================================
// SVGハイライトリセット
// ============================================================

function resetSVGHighlights() {

    if (!svgContainer) {
        return;
    }


    const highlighted =
        svgContainer.querySelectorAll(
            ".highlight"
        );


    highlighted.forEach(
        element => {

            element.classList.remove(
                "highlight"
            );

        }
    );

}


// ============================================================
// 残り手数表示
// ============================================================

function updateHandsDisplay() {

    if (!handsElement) {
        return;
    }


    handsElement.textContent =
        gameState.remainingHands;


    if (
        gameState.remainingHands <= 2
    ) {

        handsElement.classList.add(
            "danger"
        );

    }

    else {

        handsElement.classList.remove(
            "danger"
        );

    }

}


// ============================================================
// QUEST状態表示
// ============================================================

function updateQuestStatus() {

    if (!questStatusElement) {
        return;
    }


    if (gameState.cleared) {

        if (
            stageNumber === 3 &&
            stagePart === 1
        ) {

            questStatusElement.textContent =
                "1回目の合同証明完成！";

        } else {

            questStatusElement.textContent =
                "証明完成！";

        }

        return;

    }


    if (gameState.gameOver) {

        questStatusElement.textContent =
            "証明失敗";

        return;

    }


    if (gameState.conditionUnlocked) {

        questStatusElement.textContent =
            "合同条件を選ぼう";

        return;

    }


    questStatusElement.textContent =
        "証拠を集めよう";

}


// ============================================================
// メッセージ
// ============================================================

function showMessage(text) {

    if (!messageElement) {
        return;
    }


    messageElement.textContent =
        text;

}


// ============================================================
// オーバーレイ表示
// ============================================================

function showOverlay(
    title,
    text
) {

    if (!overlay) {
        return;
    }


    if (overlayTitle) {

        overlayTitle.textContent =
            title;

    }


    if (overlayText) {

        overlayText.textContent =
            text;

    }


    overlay.classList.remove(
        "hidden"
    );

}


// ============================================================
// オーバーレイ非表示
// ============================================================

function hideOverlay() {

    if (!overlay) {
        return;
    }


    overlay.classList.add(
        "hidden"
    );

}


// ============================================================
// リセット
// ============================================================

async function resetGame() {

    hideOverlay();

    initializeStage();

    await loadSVG();

}


// ============================================================
// あきらめる
// ============================================================

function giveUp() {

    if (
        gameState.gameOver ||
        gameState.cleared
    ) {
        return;
    }


    location.replace(
        "index.html"
    );

}


// ============================================================
// 配列シャッフル
// Fisher-Yates
// ============================================================

function shuffleArray(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            array[i],
            array[j]
        ] =
        [
            array[j],
            array[i]
        ];

    }


    return array;

}


// ============================================================
// イベント登録
// ============================================================

if (resetButton) {

    resetButton.addEventListener(
        "click",
        resetGame
    );

}


if (giveUpButton) {

    giveUpButton.addEventListener(
        "click",
        giveUp
    );

}


if (overlayClose) {

    overlayClose.addEventListener(
        "click",
        resetGame
    );

}


// ============================================================
// ゲーム開始
// ============================================================

loadStage();