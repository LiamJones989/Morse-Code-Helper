/* =========================================
   MORSE CODE DATA
========================================= */

const MORSE = {

    A: ".-",
    B: "-...",
    C: "-.-.",
    D: "-..",
    E: ".",
    F: "..-.",
    G: "--.",
    H: "....",
    I: "..",
    J: ".---",
    K: "-.-",
    L: ".-..",
    M: "--",
    N: "-.",
    O: "---",
    P: ".--.",
    Q: "--.-",
    R: ".-.",
    S: "...",
    T: "-",
    U: "..-",
    V: "...-",
    W: ".--",
    X: "-..-",
    Y: "-.--",
    Z: "--..",

    0: "-----",
    1: ".----",
    2: "..---",
    3: "...--",
    4: "....-",
    5: ".....",
    6: "-....",
    7: "--...",
    8: "---..",
    9: "----."

};


/* =========================================
   REVERSE LOOKUP
========================================= */

const REVERSE_MORSE = {};

Object.entries(MORSE).forEach(
    ([letter, code]) => {

        REVERSE_MORSE[code] = letter;

    }
);


/* =========================================
   COMMUNICATOR ELEMENTS
========================================= */

const morseEnabled =
    document.getElementById("morseEnabled");

const morseStatus =
    document.getElementById("morseStatus");

const morseOutput =
    document.getElementById("morseOutput");

const decodedOutput =
    document.getElementById("decodedOutput");

const clearMorse =
    document.getElementById("clearMorse");

const keyStatus =
    document.getElementById("keyStatus");

const currentSymbolDisplay =
    document.getElementById("currentSymbol");

const liveKeyDisplay =
    document.querySelector(".live-key-display");


/* =========================================
   COMMUNICATOR STATE
========================================= */

let currentLetter = "";

let morseMessage = "";

let spacePressed = false;

let spaceStartTime = 0;

let letterTimer = null;

let wordTimer = null;


/*
 * Timing controls.
 *
 * The tone itself begins immediately.
 *
 * Anything under 400ms is a dot.
 * Anything 400ms or longer is a dash.
 *
 * This gives you considerably more
 * room to transmit comfortably.
 */

const DASH_THRESHOLD = 400;


/*
 * Wait this long after releasing
 * Space before processing the letter.
 *
 * This is intentionally longer than
 * the original version.
 */

const LETTER_GAP = 950;


/*
 * Wait this long without a new signal
 * before creating a word space.
 */

const WORD_GAP = 1900;


/*
 * Morse tone frequency.
 *
 * Requested: 800Hz.
 */

const MORSE_FREQUENCY = 800;


/*
 * Volume.
 */

const MORSE_VOLUME = 0.16;


/* =========================================
   AUDIO ENGINE
========================================= */

let audioContext = null;

let communicatorOscillator = null;

let communicatorGain = null;


/*
 * Create the audio context only
 * when the user interacts with the page.
 */

function getAudioContext() {

    if (!audioContext) {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContext) {
            return null;
        }

        audioContext =
            new AudioContext();

    }


    if (
        audioContext.state === "suspended"
    ) {

        audioContext.resume();

    }


    return audioContext;

}


/* =========================================
   START LIVE TONE
========================================= */

function startCommunicatorTone() {

    const audio =
        getAudioContext();

    if (!audio) {
        return;
    }


    /*
     * Prevent multiple oscillators
     * from being created if the browser
     * sends repeated key events.
     */

    if (communicatorOscillator) {
        return;
    }


    communicatorOscillator =
        audio.createOscillator();

    communicatorGain =
        audio.createGain();


    communicatorOscillator.type =
        "sine";


    /*
     * EXACTLY 800Hz.
     */

    communicatorOscillator.frequency.setValueAtTime(
        MORSE_FREQUENCY,
        audio.currentTime
    );


    communicatorGain.gain.setValueAtTime(
        0.001,
        audio.currentTime
    );


    /*
     * Very quick fade-in so the tone
     * starts immediately without a click.
     */

    communicatorGain.gain.exponentialRampToValueAtTime(
        MORSE_VOLUME,
        audio.currentTime + 0.008
    );


    communicatorOscillator.connect(
        communicatorGain
    );

    communicatorGain.connect(
        audio.destination
    );


    communicatorOscillator.start();

}


/* =========================================
   STOP LIVE TONE
========================================= */

function stopCommunicatorTone() {

    if (
        !communicatorOscillator ||
        !communicatorGain ||
        !audioContext
    ) {

        return;

    }


    const oscillator =
        communicatorOscillator;

    const gain =
        communicatorGain;


    /*
     * Small fade-out prevents an
     * unpleasant click when released.
     */

    gain.gain.cancelScheduledValues(
        audioContext.currentTime
    );

    gain.gain.setValueAtTime(
        Math.max(
            gain.gain.value,
            0.001
        ),
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.015
    );


    oscillator.stop(
        audioContext.currentTime + 0.02
    );


    communicatorOscillator = null;

    communicatorGain = null;

}


/* =========================================
   ENABLE / DISABLE MORSE
========================================= */

morseEnabled.addEventListener(
    "change",
    () => {

        if (morseEnabled.checked) {

            morseStatus.textContent =
                "ACTIVE";

            morseStatus.style.color =
                "#39ff88";

        } else {

            morseStatus.textContent =
                "STANDBY";

            morseStatus.style.color =
                "";

            /*
             * Make absolutely sure a tone
             * cannot remain stuck on.
             */

            stopCommunicatorTone();

            spacePressed = false;

            keyStatus.textContent =
                "RELEASED";

            currentSymbolDisplay.textContent =
                "—";

            liveKeyDisplay.classList.remove(
                "active"
            );

        }

    }
);


/* =========================================
   SPACEBAR DOWN
========================================= */

document.addEventListener(
    "keydown",
    event => {

        /*
         * Morse communicator.
         */

        if (
            event.code === "Space" &&
            morseEnabled.checked &&
            !spacePressed
        ) {

            event.preventDefault();

            spacePressed = true;

            spaceStartTime =
                performance.now();


            /*
             * START THE SOUND IMMEDIATELY.
             */

            startCommunicatorTone();


            /*
             * Update visual status.
             */

            keyStatus.textContent =
                "PRESSED";

            currentSymbolDisplay.textContent =
                "●";

            liveKeyDisplay.classList.add(
                "active"
            );


            /*
             * Cancel any pending
             * letter processing.
             */

            clearTimeout(letterTimer);

            clearTimeout(wordTimer);

        }

    }
);


/* =========================================
   SPACEBAR UP
========================================= */

document.addEventListener(
    "keyup",
    event => {

        if (
            event.code === "Space" &&
            morseEnabled.checked &&
            spacePressed
        ) {

            event.preventDefault();


            /*
             * Stop the tone immediately.
             */

            stopCommunicatorTone();


            spacePressed = false;


            const duration =
                performance.now() -
                spaceStartTime;


            /*
             * Decide dot or dash.
             */

            if (
                duration <
                DASH_THRESHOLD
            ) {

                currentLetter += ".";

                currentSymbolDisplay.textContent =
                    ".";

            } else {

                currentLetter += "-";

                currentSymbolDisplay.textContent =
                    "—";

            }


            keyStatus.textContent =
                "RELEASED";

            liveKeyDisplay.classList.remove(
                "active"
            );


            updateCommunicator();


            /*
             * Give the user almost a full
             * second to continue transmitting
             * the same letter.
             */

            clearTimeout(letterTimer);

            letterTimer = setTimeout(
                finishLetter,
                LETTER_GAP
            );


            /*
             * Longer inactivity creates
             * a word break.
             */

            clearTimeout(wordTimer);

            wordTimer = setTimeout(
                finishWord,
                WORD_GAP
            );

        }

    }
);


/* =========================================
   UPDATE COMMUNICATOR
========================================= */

function updateCommunicator() {

    morseOutput.innerHTML =
        escapeHtml(morseMessage) +
        `<span>${currentLetter}</span>` +
        `<span class="cursor">_</span>`;

}


/* =========================================
   FINISH LETTER
========================================= */

function finishLetter() {

    if (!currentLetter) {
        return;
    }


    const decoded =
        REVERSE_MORSE[currentLetter] || "?";


    morseMessage +=
        currentLetter + " ";


    /*
     * Remove placeholder text.
     */

    if (
        decodedOutput.textContent ===
        "Waiting for transmission..."
    ) {

        decodedOutput.textContent = "";

        decodedOutput.classList.remove(
            "placeholder"
        );

    }


    decodedOutput.textContent +=
        decoded;


    currentLetter = "";

    currentSymbolDisplay.textContent =
        "—";


    updateCommunicator();

}


/* =========================================
   FINISH WORD
========================================= */

function finishWord() {

    /*
     * Process any remaining letter first.
     */

    finishLetter();


    if (
        decodedOutput.textContent &&
        !decodedOutput.textContent.endsWith(" ")
    ) {

        decodedOutput.textContent += " ";

        morseMessage += " / ";

        updateCommunicator();

    }

}


/* =========================================
   CLEAR COMMUNICATOR
========================================= */

clearMorse.addEventListener(
    "click",
    () => {

        morseMessage = "";

        currentLetter = "";

        clearTimeout(letterTimer);

        clearTimeout(wordTimer);

        stopCommunicatorTone();

        spacePressed = false;

        decodedOutput.textContent =
            "Waiting for transmission...";

        decodedOutput.classList.add(
            "placeholder"
        );

        keyStatus.textContent =
            "RELEASED";

        currentSymbolDisplay.textContent =
            "—";

        liveKeyDisplay.classList.remove(
            "active"
        );

        updateCommunicator();

    }
);


/* =========================================
   GAME WORDS
========================================= */

const WORDS = [

    "APPLE",
    "RADIO",
    "CODE",
    "COMPUTER",
    "ROCKET",
    "SPACE",
    "MOON",
    "EARTH",
    "SIGNAL",
    "MORSE",
    "TRAIN",
    "HELLO",
    "WORLD",
    "LIGHT",
    "SOUND",
    "BRAIN",
    "PHONE",
    "HOUSE",
    "WATER",
    "FIRE",
    "TREE",
    "DOG",
    "CAT",
    "BOOK",
    "SCHOOL",
    "ENGINEER",
    "ROBOT",
    "SERVER",
    "PYTHON",
    "JAVASCRIPT",
    "GITHUB",
    "PROJECT",
    "NETWORK",
    "SATELLITE",
    "CAMERA",
    "WIRE",
    "POWER",
    "FUTURE"

];


/* =========================================
   GAME ELEMENTS
========================================= */

const listenMode =
    document.getElementById("listenMode");

const spaceMode =
    document.getElementById("spaceMode");

const targetWord =
    document.getElementById("targetWord");

const challengeHint =
    document.getElementById("challengeHint");

const gameInput =
    document.getElementById("gameInput");

const playMorse =
    document.getElementById("playMorse");

const newWord =
    document.getElementById("newWord");

const scoreDisplay =
    document.getElementById("score");

const streakDisplay =
    document.getElementById("streak");

const wordsPlayedDisplay =
    document.getElementById("wordsPlayed");

const gameMessage =
    document.getElementById("gameMessage");

const speed =
    document.getElementById("speed");

const speedText =
    document.getElementById("speedText");


/* =========================================
   GAME STATE
========================================= */

let gameMode = "listen";

let currentWord = "";

let score = 0;

let streak = 0;

let wordsPlayed = 0;

let gameLetter = "";

let gameSpacePressed = false;

let gameSpaceStart = 0;

let gameLetterTimer = null;

let gameOscillator = null;

let gameGain = null;


/* =========================================
   GAME MODE SWITCHING
========================================= */

listenMode.addEventListener(
    "click",
    () => {

        gameMode = "listen";

        listenMode.classList.add(
            "active"
        );

        spaceMode.classList.remove(
            "active"
        );

        gameInput.placeholder =
            "Type what you hear...";

        challengeHint.textContent =
            "Listen carefully...";

        newGameWord();

    }
);


spaceMode.addEventListener(
    "click",
    () => {

        gameMode = "space";

        spaceMode.classList.add(
            "active"
        );

        listenMode.classList.remove(
            "active"
        );

        gameInput.placeholder =
            "Transmit using Spacebar...";

        challengeHint.textContent =
            "Use Spacebar to transmit the word.";

        newGameWord();

    }
);


/* =========================================
   NEW GAME WORD
========================================= */

function newGameWord() {

    let newWordValue;


    do {

        newWordValue =
            WORDS[
                Math.floor(
                    Math.random() *
                    WORDS.length
                )
            ];

    } while (
        newWordValue === currentWord &&
        WORDS.length > 1
    );


    currentWord =
        newWordValue;


    gameInput.value = "";

    gameLetter = "";

    clearTimeout(gameLetterTimer);


    gameMessage.textContent = "";

    gameMessage.className =
        "game-message";


    if (gameMode === "listen") {

        targetWord.textContent =
            "???";


        challengeHint.textContent =
            "Listen carefully...";


        setTimeout(
            () => playWord(currentWord),
            350
        );

    } else {

        targetWord.textContent =
            currentWord;

        challengeHint.textContent =
            "Use Spacebar to transmit the word.";

    }

}


/* =========================================
   LISTEN MODE INPUT
========================================= */

gameInput.addEventListener(
    "input",
    () => {

        if (gameMode !== "listen") {
            return;
        }


        const answer =
            gameInput.value
                .trim()
                .toUpperCase();


        if (
            answer.length !==
            currentWord.length
        ) {

            return;

        }


        wordsPlayed++;


        if (
            answer === currentWord
        ) {

            score++;

            streak++;


            showGameMessage(
                "CORRECT",
                true
            );

        } else {

            streak = 0;


            showGameMessage(
                `INCORRECT — ${currentWord}`,
                false
            );

        }


        updateStats();


        setTimeout(
            newGameWord,
            1000
        );

    }
);


/* =========================================
   GAME SPACEBAR DOWN
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            gameMode !== "space" ||
            !spaceMode.classList.contains(
                "active"
            )
        ) {

            return;

        }


        if (
            event.code === "Space" &&
            !gameSpacePressed
        ) {

            event.preventDefault();

            gameSpacePressed = true;

            gameSpaceStart =
                performance.now();


            /*
             * Start game tone immediately.
             */

            startGameTone();


            challengeHint.textContent =
                "Transmitting...";

        }

    }
);


/* =========================================
   GAME SPACEBAR UP
========================================= */

document.addEventListener(
    "keyup",
    event => {

        if (
            gameMode !== "space" ||
            event.code !== "Space" ||
            !gameSpacePressed
        ) {

            return;

        }


        event.preventDefault();


        stopGameTone();


        gameSpacePressed = false;


        const duration =
            performance.now() -
            gameSpaceStart;


        if (
            duration <
            DASH_THRESHOLD
        ) {

            gameLetter += ".";

        } else {

            gameLetter += "-";

        }


        clearTimeout(gameLetterTimer);


        gameLetterTimer =
            setTimeout(
                finishGameLetter,
                LETTER_GAP
            );


        challengeHint.textContent =
            `Current Morse: ${gameLetter}`;

    }
);


/* =========================================
   FINISH GAME LETTER
========================================= */

function finishGameLetter() {

    if (!gameLetter) {
        return;
    }


    const decoded =
        REVERSE_MORSE[gameLetter] || "?";


    gameInput.value +=
        decoded;


    gameLetter = "";


    challengeHint.textContent =
        "Keep transmitting...";


    /*
     * Check if the entire answer
     * has been transmitted.
     */

    if (
        gameInput.value.length >=
        currentWord.length
    ) {

        const answer =
            gameInput.value
                .trim()
                .toUpperCase();


        wordsPlayed++;


        if (
            answer === currentWord
        ) {

            score++;

            streak++;


            showGameMessage(
                "CORRECT",
                true
            );

        } else {

            streak = 0;


            showGameMessage(
                `INCORRECT — ${currentWord}`,
                false
            );

        }


        updateStats();


        setTimeout(
            newGameWord,
            1100
        );

    }

}


/* =========================================
   GAME AUDIO START
========================================= */

function startGameTone() {

    const audio =
        getAudioContext();

    if (!audio) {
        return;
    }


    if (gameOscillator) {
        return;
    }


    gameOscillator =
        audio.createOscillator();

    gameGain =
        audio.createGain();


    gameOscillator.type =
        "sine";


    /*
     * Game tone is ALSO exactly 800Hz.
     */

    gameOscillator.frequency.setValueAtTime(
        MORSE_FREQUENCY,
        audio.currentTime
    );


    gameGain.gain.setValueAtTime(
        0.001,
        audio.currentTime
    );


    gameGain.gain.exponentialRampToValueAtTime(
        MORSE_VOLUME,
        audio.currentTime + 0.008
    );


    gameOscillator.connect(
        gameGain
    );

    gameGain.connect(
        audio.destination
    );


    gameOscillator.start();

}


/* =========================================
   GAME AUDIO STOP
========================================= */

function stopGameTone() {

    if (
        !gameOscillator ||
        !gameGain ||
        !audioContext
    ) {

        return;

    }


    const oscillator =
        gameOscillator;

    const gain =
        gameGain;


    gain.gain.cancelScheduledValues(
        audioContext.currentTime
    );


    gain.gain.setValueAtTime(
        Math.max(
            gain.gain.value,
            0.001
        ),
        audioContext.currentTime
    );


    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.015
    );


    oscillator.stop(
        audioContext.currentTime + 0.02
    );


    gameOscillator = null;

    gameGain = null;

}


/* =========================================
   GAME MESSAGE
========================================= */

function showGameMessage(
    message,
    correct
) {

    gameMessage.textContent =
        message;


    gameMessage.className =
        correct
            ? "game-message correct"
            : "game-message incorrect";

}


/* =========================================
   UPDATE GAME STATS
========================================= */

function updateStats() {

    scoreDisplay.textContent =
        score;

    streakDisplay.textContent =
        streak;

    wordsPlayedDisplay.textContent =
        wordsPlayed;

}


/* =========================================
   MORSE AUDIO PLAYBACK
========================================= */

function playWord(word) {

    let delay = 0;

    const timing =
        getTiming();


    word.split("").forEach(
        letter => {

            const code =
                MORSE[letter];


            if (!code) {
                return;
            }


            code.split("").forEach(
                symbol => {

                    setTimeout(
                        () => {

                            playTone(
                                MORSE_FREQUENCY,
                                timing.toneLength
                            );

                        },
                        delay
                    );


                    if (symbol === ".") {

                        delay +=
                            timing.dot;

                    } else {

                        delay +=
                            timing.dash;

                    }


                    delay +=
                        timing.symbolGap;

                }
            );


            delay +=
                timing.letterGap;

        }
    );

}


/* =========================================
   PLAY SINGLE TONE
========================================= */

function playTone(
    frequency,
    duration
) {

    const audio =
        getAudioContext();

    if (!audio) {
        return;
    }


    const oscillator =
        audio.createOscillator();

    const gain =
        audio.createGain();


    oscillator.type =
        "sine";


    oscillator.frequency.setValueAtTime(
        frequency,
        audio.currentTime
    );


    oscillator.connect(gain);

    gain.connect(
        audio.destination
    );


    gain.gain.setValueAtTime(
        0.001,
        audio.currentTime
    );


    gain.gain.exponentialRampToValueAtTime(
        MORSE_VOLUME,
        audio.currentTime + 0.008
    );


    oscillator.start();


    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audio.currentTime +
        duration / 1000
    );


    oscillator.stop(
        audio.currentTime +
        duration / 1000 +
        0.02
    );

}


/* =========================================
   SPEED
========================================= */

function getTiming() {

    /*
     * These control the playback speed
     * of the listening game.
     *
     * All playback is still 800Hz.
     */

    if (speed.value === "1") {

        return {

            dot: 240,

            dash: 720,

            symbolGap: 170,

            letterGap: 550,

            toneLength: 180

        };

    }


    if (speed.value === "3") {

        return {

            dot: 90,

            dash: 270,

            symbolGap: 65,

            letterGap: 260,

            toneLength: 70

        };

    }


    return {

        dot: 150,

        dash: 450,

        symbolGap: 100,

        letterGap: 400,

        toneLength: 110

    };

}


/* =========================================
   SPEED SLIDER
========================================= */

speed.addEventListener(
    "input",
    () => {

        const names = {

            1: "SLOW",
            2: "MEDIUM",
            3: "FAST"

        };


        speedText.textContent =
            names[speed.value];

    }
);


/* =========================================
   PLAY AGAIN
========================================= */

playMorse.addEventListener(
    "click",
    () => {

        if (!currentWord) {
            return;
        }


        playWord(currentWord);

    }
);


/* =========================================
   NEW CHALLENGE
========================================= */

newWord.addEventListener(
    "click",
    newGameWord
);


/* =========================================
   REFERENCE TABLE
========================================= */

const referenceGrid =
    document.getElementById(
        "referenceGrid"
    );


Object.entries(MORSE).forEach(
    ([character, code]) => {

        const item =
            document.createElement("div");


        item.className =
            "reference-item";


        item.innerHTML = `
            <strong>${character}</strong>
            <span>${code}</span>
        `;


        referenceGrid.appendChild(item);

    }
);


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(text) {

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================
   INITIALIZE
========================================= */

decodedOutput.classList.add(
    "placeholder"
);

updateCommunicator();

newGameWord();
