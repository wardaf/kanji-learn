import { n5Part1 } from './n5-part1.js';
import { n5Part2 } from './n5-part2.js';
import { n5Part3 } from './n5-part3.js';
import { n5Part4 } from './n5-part4.js';
import { n5Part5 } from './n5-part5.js';
import { n5Part6 } from './n5-part6.js';
import { n4Part1 } from './n4-part1.js';
import { n4Part2 } from './n4-part2.js';
import { n4Part3 } from './n4-part3.js';
import { n4Part4 } from './n4-part4.js';
import { n4Part5 } from './n4-part5.js';
import { n4Part6 } from './n4-part6.js';

let kanjiData = {
  N5: {
    'Part 1': n5Part1,
    'Part 2': n5Part2,
    'Part 3': n5Part3,
    'Part 4': n5Part4,
    'Part 5': n5Part5,
    'Part 6': n5Part6
  },
  N4: {
    'Part 1': n4Part1,
    'Part 2': n4Part2,
    'Part 3': n4Part3,
    'Part 4': n4Part4,
    'Part 5': n4Part5,
    'Part 6': n4Part6
  },
  N3: {}
};

let currentLevel = '';
let currentPart = '';
let currentKanjiIndex = 0;
let quizAnswers = {};
let shuffledKanji = [];
let correctCount = 0; // Penghitung jawaban benar
let incorrectCount = 0; // Penghitung jawaban salah

// Sound effects (semua dari Soundjay.com)
const clickSound = new Audio('https://www.soundjay.com/buttons/sounds/button-37a.mp3'); // Button click
const correctSound = new Audio('https://www.soundjay.com/misc/sounds/magic-chime-01.mp3'); // Jawaban benar
const incorrectSound = new Audio('https://www.soundjay.com/buttons/sounds/beep-03.mp3'); // Jawaban salah (sudah berfungsi)
const completeSound = new Audio('https://www.soundjay.com/misc/sounds/dream-harp-06.mp3'); // Quiz selesai

// Preload audio dan tambahkan error handling saat load
function preloadAudio(sound, name) {
  sound.load();
  sound.oncanplaythrough = () => console.log(`${name} loaded successfully`);
  sound.onerror = (e) => console.error(`Error loading ${name}:`, e);
}

// Preload semua audio saat aplikasi dimulai
preloadAudio(clickSound, 'Click Sound');
preloadAudio(correctSound, 'Correct Sound');
preloadAudio(incorrectSound, 'Incorrect Sound');
preloadAudio(completeSound, 'Complete Sound');

// Fungsi untuk memutar audio dengan error handling
function playSound(sound, name) {
  const promise = sound.play();
  if (promise !== undefined) {
    promise.catch(error => {
      console.error(`Error playing ${name}:`, error);
    });
  }
}

const levelSection = document.getElementById('levelSelection');
const partSection = document.getElementById('partSelection');
const learnSection = document.getElementById('learnSection');
const quizSection = document.getElementById('quizSection');
const partList = document.getElementById('partList');
const kanjiList = document.getElementById('kanjiList');
const quizContent = document.getElementById('quizContent');
const backToLevel = document.getElementById('backToLevel');
const backToPart = document.getElementById('backToPart');
const startQuiz = document.getElementById('startQuiz');
const backToLearn = document.getElementById('backToLearn');
const backToLevelFromQuiz = document.getElementById('backToLevelFromQuiz');
const resetQuiz = document.getElementById('resetQuiz');
const hideRomaji = document.getElementById('hideRomaji');
const hideMeaning = document.getElementById('hideMeaning');

// Load N3 data
fetch('./n3.json')
  .then(response => response.json())
  .then(data => {
    kanjiData.N3 = data.N3;
    initializeApp();
  })
  .catch(error => console.error('Error loading N3:', error));

function initializeApp() {
  document.querySelectorAll('.level-card').forEach(card => {
    card.addEventListener('click', () => {
      currentLevel = card.dataset.level;
      playSound(clickSound, 'Click Sound'); // Mainkan sound effect saat level dipilih
      showPartSelection();
    });
  });
}

function hideAllSections() {
  levelSection.classList.add('hidden');
  partSection.classList.add('hidden');
  learnSection.classList.add('hidden');
  quizSection.classList.add('hidden');
}

function showPartSelection() {
  hideAllSections();
  partSection.classList.remove('hidden');
  partList.innerHTML = '';
  Object.keys(kanjiData[currentLevel]).forEach(part => {
    const partDiv = document.createElement('div');
    partDiv.className = 'part-card';
    partDiv.textContent = part;
    partDiv.addEventListener('click', () => {
      currentPart = part;
      playSound(clickSound, 'Click Sound'); // Mainkan sound effect saat part dipilih
      showLearnMode();
    });
    partList.appendChild(partDiv);
  });
  backToLevel.onclick = () => {
    playSound(clickSound, 'Click Sound'); // Mainkan sound effect saat tombol diklik
    hideAllSections() || levelSection.classList.remove('hidden');
  };
}

function showLearnMode() {
  hideAllSections();
  learnSection.classList.remove('hidden');
  updateLearnDisplay();

  hideRomaji.onchange = updateLearnDisplay;
  hideMeaning.onchange = updateLearnDisplay;
  backToPart.onclick = () => {
    playSound(clickSound, 'Click Sound'); // Mainkan sound effect saat tombol diklik
    showPartSelection();
  };
  startQuiz.onclick = () => {
    playSound(clickSound, 'Click Sound'); // Mainkan sound effect saat tombol diklik
    showQuizMode();
  };
}

function updateLearnDisplay() {
  const showRomaji = !hideRomaji.checked;
  const showMeaning = !hideMeaning.checked;
  kanjiList.innerHTML = kanjiData[currentLevel][currentPart].map(k => `
    <div class="kanji-card">
      <h3 class="large-kanji">${k.kanji}</h3>
      ${showRomaji ? `<p>${k.romaji}</p>` : ''}
      ${showMeaning ? `<p class="meaning">${k.meaning}</p>` : ''}
    </div>
  `).join('');
}

function showQuizMode() {
  hideAllSections();
  quizSection.classList.remove('hidden');
  currentKanjiIndex = 0;
  correctCount = 0; // Reset penghitung
  incorrectCount = 0; // Reset penghitung
  quizAnswers = {};
  shuffledKanji = [...kanjiData[currentLevel][currentPart]];
  shuffledKanji.sort(() => Math.random() - 0.5);
  generateQuiz();
}

function updateScoreDisplay() {
  const scoreDisplay = document.getElementById('scoreDisplay');
  scoreDisplay.innerHTML = `
    <div class="score-container">
      <div class="score-item correct-score">
        <span class="score-icon correct-icon"></span>
        <span class="score-number">${correctCount}</span>
      </div>
      <div class="score-item incorrect-score">
        <span class="score-icon incorrect-icon"></span>
        <span class="score-number">${incorrectCount}</span>
      </div>
    </div>
  `;
}

function generateQuiz() {
  const totalKanji = kanjiData[currentLevel][currentPart].length;
  if (currentKanjiIndex >= totalKanji) {
    quizContent.innerHTML = `
      <h3>Quiz Completed!</h3>
      <div id="scoreDisplay"></div>
    `;
    resetQuiz.classList.remove('hidden');
    playSound(completeSound, 'Complete Sound'); // Mainkan sound effect saat quiz selesai
    updateScoreDisplay();
    return;
  }

  const currentKanji = shuffledKanji[currentKanjiIndex];
  const options = getRandomOptions(currentKanji);
  quizContent.innerHTML = `
    <h3 class="large-kanji">${currentKanji.kanji}</h3>
    <div id="scoreDisplay"></div>
    <p>${currentKanjiIndex + 1}/${totalKanji}</p>
    ${options.map((opt, i) => `
      <div class="option" data-index="${i}" data-correct="${opt.romaji === currentKanji.romaji && opt.meaning === currentKanji.meaning}">
        ${opt.romaji} - ${opt.meaning}
        <span class="feedback-icon"></span>
      </div>
    `).join('')}
  `;
  updateScoreDisplay();
  document.querySelectorAll('.option').forEach(option => {
    option.addEventListener('click', (event) => {
      checkAnswer(event);
      playSound(clickSound, 'Click Sound'); // Mainkan sound effect saat opsi diklik
    });
  });
}

function getRandomOptions(correctKanji) {
  const options = [{ romaji: correctKanji.romaji, meaning: correctKanji.meaning }];
  while (options.length < 4) {
    const randomKanji = kanjiData[currentLevel][currentPart][Math.floor(Math.random() * kanjiData[currentLevel][currentPart].length)];
    const option = { romaji: randomKanji.romaji, meaning: randomKanji.meaning };
    if (!options.some(o => o.romaji === option.romaji && o.meaning === option.meaning) &&
        (option.romaji !== correctKanji.romaji || option.meaning !== correctKanji.meaning)) {
      options.push(option);
    }
  }
  return options.sort(() => Math.random() - 0.5);
}

function checkAnswer(event) {
  const option = event.target.closest('.option');
  const isCorrect = option.dataset.correct === 'true';
  option.classList.add(isCorrect ? 'correct' : 'incorrect');
  option.querySelector('.feedback-icon').textContent = isCorrect ? '✓' : '✗';
  document.querySelectorAll('.option').forEach(opt => opt.style.pointerEvents = 'none');

  // Update penghitung
  if (isCorrect) {
    correctCount++;
    playSound(correctSound, 'Correct Sound');
  } else {
    incorrectCount++;
    playSound(incorrectSound, 'Incorrect Sound');
  }
  updateScoreDisplay();

  // Otomatis next setelah 1 detik
  setTimeout(() => {
    currentKanjiIndex++;
    generateQuiz();
  }, 1000);
}

backToLearn.onclick = () => {
  playSound(clickSound, 'Click Sound'); // Mainkan sound effect saat tombol diklik
  showLearnMode();
};
backToLevelFromQuiz.onclick = () => {
  playSound(clickSound, 'Click Sound'); // Mainkan sound effect saat tombol diklik
  hideAllSections() || levelSection.classList.remove('hidden');
};
resetQuiz.onclick = () => {
  playSound(clickSound, 'Click Sound'); // Mainkan sound effect saat tombol diklik
  showQuizMode();
};