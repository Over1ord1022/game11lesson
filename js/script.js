// Получаем canvas элемент и его основные параметры
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
canvas.width = 700;
canvas.height = 500;

const keys = ["w", "a", "s", "d"]; // Клавиши, которые будут использоваться в игре
const sidePadding = 30; // Отступы по бокам для зон клавиш
const availableWidth = canvas.width - 2 * sidePadding; // Доступная ширина для зон клавиш (общая ширина минус отступы)
const keyZoneWidth = availableWidth / keys.length; // Ширина одной зоны клавиши
// Создаем массив зон для каждой клавиши с координатами и размерами
const keyZones = keys.map((key, index) => ({
  key,
  x: sidePadding + (index * keyZoneWidth),
  width: keyZoneWidth
}));

//Параметры нот
let notes = [],
    score = 0,
    timer = 60,
    playerName = "",
    gameRunning = false,
    noteSpeed = 3,
    noteInterval = 700,
    lastNoteTime = 0,
    difficulty = document.querySelector('select').value;

//Элементы игры
const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const playerNameEl = document.getElementById("player-name");

loadHighScores(); //Загружаем статистику лучших рекордов

//Настройка звука с помощью библиотеки Howler.js
const sound = new Howl({
  src: ["audio/Spark.mp3"],
  volume: 0.3
});
const sound2 = new Howl({
  src: ["audio/click.mp3"],
  volume: 1
});

// Функция возвращает случайную клавишу из доступных
function getRandomKey() {
  return keys[Math.floor(Math.random() * keys.length)];
}

// Создаем новую ноту и добавляет ее в массив
function spawnNote() {
  const key = getRandomKey();
  const zone = keyZones.find(z => z.key === key);
  notes.push({ key, x: zone.x + 8, y: -20 });
}

// Обновляет позиции всех нот (движение вниз)
function updateNotes() {
  for (const note of notes) note.y += noteSpeed;
  notes = notes.filter(n => n.y < canvas.height + 50);
}

// Отрисовываем все ноты и зоны клавиш
function drawNotes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const note of notes) {
    ctx.font = "20px Arial";
    ctx.fillStyle = "cyan";
    ctx.fillRect(note.x, note.y, canvas.width/4 - 30, 40);
    ctx.fillStyle = "white";
    ctx.fillText(note.key.toUpperCase(), note.x + 60, note.y + 25);
  }
  
  keyZones.forEach(z => {
    ctx.strokeStyle = "white";
    ctx.strokeRect(z.x, canvas.height - 60, z.width, 60);
  });
}

// Проверяет попадание по ноте при нажатии клавиши
function checkHit(key) {
  const zone = keyZones.find(z => z.key === key);
  const targetY = canvas.height - 60;
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    if (n.key === key && n.y > targetY - 30 && n.y < targetY + 30) {
      notes.splice(i, 1);
      score += 100;
      scoreEl.textContent = score;
      return;
    }
  }
  score -= 25;
  if (score < 0) score = 0;
  scoreEl.textContent = score;
}
// Главный игровой цикл
function gameLoop(timestamp) {
  if (!gameRunning) return;
  if (timestamp - lastNoteTime > noteInterval) { // Создаем новую ноту, если прошел нужный интервал
    spawnNote();
    lastNoteTime = timestamp;
  }
  updateNotes();
  drawNotes();
  requestAnimationFrame(gameLoop);
}

// Устанавливает параметры игры в зависимости от сложности
function setDifficulty(level) {
  difficulty = level;
  switch (level) {
    case "easy":
      noteSpeed = 2;
      noteInterval = 2000;
      break;
    case "medium":
      noteSpeed = 3;
      noteInterval = 700;
      break;
    case "hard":
      noteSpeed = 4;
      noteInterval = 500;
      break;
  }
}


// Начинаем игру
function startGame() {
  document.getElementById("tutorial").classList.add("hidden");
  document.getElementById("mid-lin").classList.add("hidden");
  document.getElementById("last-lin").classList.add("hidden");
  document.getElementById("statistic").classList.add("hidden");
  document.getElementById("player-form").classList.add("hidden");
  document.getElementById("stats").classList.remove("hidden");

  gameRunning = true;
  sound.play();
  lastNoteTime = performance.now();
  setInterval(() => {
    if (!gameRunning) return;
    timer--;
    timerEl.textContent = timer;
    if (timer <= 0) endGame();
  }, 1000);
  requestAnimationFrame(gameLoop);
}

// Завершает игру
function endGame() {
  gameRunning = false;
  sound.stop();

  document.getElementById("end-game").classList.remove("hidden");

  saveScore(playerName, score);

  document.getElementById("end-button").addEventListener("click", () => {
    document.getElementById("end-game").classList.add("hidden");
    location.reload();
  });
}

// Сохраняем результат игрока в localStorage
function saveScore(name, score) {
    const scores = JSON.parse(localStorage.getItem('scores')) || [];
    scores.push({name, score});
    localStorage.setItem('scores', JSON.stringify(scores));
}

// Обработчик нажатий клавиш
window.addEventListener("keydown", (e) => {
  if (!gameRunning) return;
  const key = e.key.toLowerCase();
  if (keys.includes(key)) checkHit(key);
});

// Обработчик кнопки начала игры
const buttPlay = document.getElementById("play");
buttPlay.addEventListener("click", (e) => {
  sound2.play();
  e.preventDefault();
  const nameInput = document.getElementById("name-input");
  const value = nameInput.value.trim();
  if (!/^[a-zA-Zа-яА-Я0-9_]{2,12}$/.test(value)) { // Проверяем ввод пользователя и валидность имени
    document.getElementById("error").classList.remove("hidden");
    return;
  }
  document.getElementById("error").classList.add("hidden");

  playerName = value;
  playerNameEl.textContent = playerName;
  document.getElementById("name-form").classList.add("hidden");

  const savedDifficulty = difficulty;
  setDifficulty(savedDifficulty);
  
  
  startGame();
});

// Загрузка статистики из localStorage
function loadHighScores() {
    const scores = JSON.parse(localStorage.getItem('scores')) || [];
    const ScoresList = document.getElementById('ScoresList');

    ScoresList.innerHTML = '';
    // Сортировка и отображение топ-5 результатов
    scores.sort((a, b) => b.score - a.score).slice(0, 5).forEach((score) => {
        const li = document.createElement('li');
        li.textContent = `${score.name}: ${score.score}`;
        ScoresList.appendChild(li);
    });
}