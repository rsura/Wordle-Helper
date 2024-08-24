// SET UP AND CONSTANTS --------------------------------------------------

let correctLetters = "*****";
const unusedLetters = new Set();
const presentLetters = new Set();
const yellowLetters = Array.from({ length: 5 }, () => new Set());
const currentWordList = Array(6).fill("");

const wordSet = new Set();
fetch('https://raw.githubusercontent.com/rsura/WordHunt-Solver/main/src/EnglishWords.txt')
  .then(response => response.text())
  .then(text => {
    text.split('\n').map(word => word.trim().toUpperCase())
      .filter(word => word.length === 5)
      .forEach(word => wordSet.add(word));
  });

// HELPER FUNCTIONS -------------------------------------------------------

const replaceLetter = (str, index, letter) => str.substring(0, index) + letter + str.substring(index + 1);

const zip = (...arrays) => {
    const minLength = Math.min(...arrays.map(arr => arr.length));
    return Array.from({ length: minLength }, (_, i) => arrays.map(arr => arr[i]));
};

// MAIN FUNCTIONS ---------------------------------------------------------

const waitForTilesToLoad = async (millis) => {
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    let tiles = [];
    while (true) {
        await delay(millis);
        tiles = Array.from(document.querySelectorAll("[class*='Tile-module_tile__']"));
        // console.log("Current length of tiles:", tiles.length);

        if (tiles.length === 30 && tiles.every(tile => tile.getAttribute('data-state') !== "tbd")) {
            break;
        }
    }

    await delay(millis);
    logInfo(tiles); // Proceed after ensuring all tiles are fully loaded
};

const logInfo = async (tiles) => {
    tiles.forEach((tile, i) => {
        const row = Math.floor(i / 5);
        const col = i % 5;
        const dataState = tile.getAttribute('data-state');
        const letter = tile.innerText.toUpperCase();

        switch (dataState) {
            case "empty":
                break;
            case "correct":
                correctLetters = replaceLetter(correctLetters, col, letter);
                yellowLetters[col].clear();
                break;
            case "absent":
                unusedLetters.add(letter);
                break;
            case "present":
                presentLetters.add(letter);
                yellowLetters[col].add(letter);
                break;
        }
        currentWordList[row] += letter;
    });

    // console.log("Current word list:", currentWordList);
    // console.log("Correct letters:", correctLetters);
    // console.log("Unused letters:", unusedLetters);
    // console.log("Present letters:", presentLetters);
    // console.log("Yellow letters:", yellowLetters);
    findWords();
};

const findWords = async () => {
    const potentialWords = new Set();

    for (const word of wordSet) {
        if (isValidWord(word)) {
            potentialWords.add(word);
        }
    }

    // console.log("Potential words:", potentialWords);
    updateHtml(potentialWords);
};

const isValidWord = (word) => {
    if (!Array.from(correctLetters).every((letter, i) => letter === '*' || letter === word[i])) {
        return false;
    }
    if (!Array.from(presentLetters).every(letter => word.includes(letter))) {
        return false;
    }
    if (Array.from(unusedLetters).some(letter => word.includes(letter))) {
        return false;
    }
    const zipped = zip(word, yellowLetters);
    return zipped.every(([letter, yellowSet]) => !yellowSet.has(letter));
};

const updateHtml = async (potentialWords) => {
    const wordGuessDivId = 'wordle_word_guess';
    const ad = document.querySelector("[class*='adContainer__']");
    
    if (ad) ad.remove();
    
    const existingDiv = document.getElementById(wordGuessDivId);
    if (existingDiv) existingDiv.remove();
    
    const boardContainer = document.querySelector("[class*='Board-module_boardContainer__']");
    const dimensions = document.querySelector("[class*='Board-module_board__']").getAttribute('style');
    
    // Create the new div with a sticky header
    const newDivHTML = `
        <div id="${wordGuessDivId}" style="float: right; box-sizing: border-box; overflow-y: auto; padding: 0; ${dimensions}; width: 20%; position: relative; display: flex; flex-direction: column; align-items: center; background-color: #333; border-radius: 5px; margin: 10px">
            <div id="${wordGuessDivId}_header" style="position: sticky; top: 0; background-color: #888; color: #fff; padding: 10px; font-weight: bold; text-align: center; z-index: 1000; border-radius: 5px;">
                Wordle Helper
                <br></br>
                <a href="https://www.linkedin.com/in/rahulsura/" target="_blank" style="color: white;"> 
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                </a>
            </div>
        </div>`;

    boardContainer.insertAdjacentHTML('beforeend', newDivHTML);
    
    const wordGuessDiv = document.getElementById(wordGuessDivId);
    wordGuessDiv.style.textAlign = 'center'; // Center the text and paragraphs

    potentialWords.forEach(word => {
        const p = document.createElement('p');
        p.style.cssText = `font-family: 'Courier New', Courier, monospace; font-size: larger; background-color: rgb(121, 125, 180); color: rgb(225, 225, 225); padding: 10px; border-radius: 5px; margin: 5px; width: fit-content; font-weight: bold; transition: background-color 0.3s; display: inline-block;`;
        p.textContent = word;
        p.onmouseover = () => p.style.backgroundColor = 'rgb(78, 80, 119)';
        p.onmouseout = () => p.style.backgroundColor = 'rgb(121, 125, 180)';
        wordGuessDiv.appendChild(p);
    });
};



// Add event listener for "Enter" key press
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === 'Return') {
        waitForTilesToLoad(1000);
    }
});

waitForTilesToLoad(1000);