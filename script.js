```javascript
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

Object.entries(MORSE).forEach(([letter, code]) => {

    REVERSE_MORSE[code] = letter;

});


/* =========================================
   ELEMENTS
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
 * Timing settings.
 */

const DASH_THRESHOLD = 250;

const LETTER_GAP = 600;

const WORD_GAP = 1400;


/* =========================================
   ENABLE MORSE
========================================= */

morseEnabled.addEventListener(
    "change",
    () => {

        if (morseEnabled.checked) {

            morseStatus.textContent =
                "ACTIVE";

            morseStatus.style.color =
                "#3cff91";

        } else {

            morseStatus.textContent =
                "STANDBY";

            morseStatus.style.color =
                "";

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
         * Don't trigger repeatedly
         * when the key is held.
         */

        if (
            event.code === "Space" &&
            morseEnabled.checked &&
            !spacePressed
        ) {

            /*
             * Don't allow the browser
             * to scroll.
             */

            event.preventDefault();

            spacePressed = true;

            spaceStartTime = Date.now();

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

            spacePressed = false;

            const duration =
                Date.now() - spaceStartTime;


            /*
             * Determine dot or dash.
             */

            if (duration < DASH_THRESHOLD) {

                currentLetter += ".";

            } else {

                currentLetter += "-";

            }


            updateCommunicator();


            /*
             * Finish the letter after
             * a short pause.
             */

            clearTimeout(letterTimer);

            letterTimer = setTimeout(
                finishLetter,
                LETTER_GAP
            );


            /*
             * Finish the word after
             * a longer pause.
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
     * If this is the first character,
     * replace the placeholder.
     */

    if (
        decodedOutput.textContent ===
        "Waiting for transmission..."
    ) {

        decodedOutput.textContent = "";

    }


    decodedOutput.textContent +=
        decoded;


    currentLetter = "";

    updateCommunicator();

}


/* =========================================
   FINISH WORD
========================================= */

function finishWord() {

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
   CLEAR
========================================= */

clearMorse.addEventListener(
    "click",
    () => {

        morseMessage = "";

        currentLetter = "";

        decodedOutput.textContent =
            "Waiting for transmission...";

        updateCommunicator();

    }
);


/* =========================================
   GAME DATA
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


/* =========================================
   MODE SWITCHING
========================================= */

listenMode.addEventListener(
    "click",
    () => {

        gameMode = "listen";

        listenMode.classList.add("active");

        spaceMode.classList.remove("active");

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

        spaceMode.classList.add("active");

        listenMode.classList.remove("active");

        gameInput.placeholder =
            "Transmit using Spacebar...";

        challengeHint.textContent =
            "Use Spacebar to transmit the word.";

        newGameWord();

    }
);


/* =========================================
   NEW WORD
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


    currentWord = newWordValue;

    gameInput.value = "";

    gameLetter = "";

    gameMessage.textContent = "";

    gameMessage.className =
        "game-message";


    if (gameMode === "listen") {

        targetWord.textContent = "???";

        setTimeout(
            () => playWord(currentWord),
            350
        );

    } else {

        targetWord.textContent =
            currentWord;

    }

}


/* =========================================
   LISTEN GAME
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


        if (answer === currentWord) {

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
   SPACEBAR GAME
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            gameMode !== "space" ||
            !spaceMode.classList.contains("active")
        ) {

            return;

        }


        if (
            event.code === "Space" &&
            !gameSpacePressed
        ) {

            event.preventDefault();

            gameSpacePressed = true;

            gameSpaceStart = Date.now();

        }

    }
);


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

        gameSpacePressed = false;


        const duration =
            Date.now() - gameSpaceStart;


        if (duration < DASH_THRESHOLD) {

            gameLetter += ".";

        } else {

            gameLetter += "-";

        }


        clearTimeout(gameLetterTimer);


        gameLetterTimer = setTimeout(
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


    gameInput.value += decoded;

    gameLetter = "";


    challengeHint.textContent =
        "Keep transmitting...";


    /*
     * Check if enough letters
     * have been transmitted.
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


        if (answer === currentWord) {

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
   UPDATE STATS
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
   AUDIO
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
                        () => playTone(
                            timing.frequency,
                            timing.toneLength
                        ),
                        delay
                    );


                    if (symbol === ".") {

                        delay += timing.dot;

                    } else {

                        delay += timing.dash;

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
   AUDIO TONE
========================================= */

function playTone(
    frequency,
    duration
) {

    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;


    if (!AudioContext) {
        return;
    }


    const audio =
        new AudioContext();


    const oscillator =
        audio.createOscillator();


    const gain =
        audio.createGain();


    oscillator.type =
        "sine";


    oscillator.frequency.value =
        frequency;


    oscillator.connect(gain);

    gain.connect(audio.destination);


    gain.gain.setValueAtTime(
        0.001,
        audio.currentTime
    );


    gain.gain.exponentialRampToValueAtTime(
        0.15,
        audio.currentTime + 0.01
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


    setTimeout(
        () => audio.close(),
        duration + 100
    );

}


/* =========================================
   SPEED
========================================= */

function getTiming() {

    if (speed.value === "1") {

        return {

            dot: 240,
            dash: 720,

            symbolGap: 170,

            letterGap: 550,

            toneLength: 180,

            frequency: 600

        };

    }


    if (speed.value === "3") {

        return {

            dot: 90,
            dash: 270,

            symbolGap: 65,

            letterGap: 260,

            toneLength: 70,

            frequency: 650

        };

    }


    return {

        dot: 150,
        dash: 450,

        symbolGap: 100,

        letterGap: 400,

        toneLength: 110,

        frequency: 625

    };

}


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

updateCommunicator();

newGameWord();
```

