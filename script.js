const gridContainer = document.querySelector(".grid-container");
let cards = [];
let firstCard, secondCard;
let lockBoard = false;
let score = 0;
let timer;
let timeLeft = 90;
let currentDifficulty = "easy"; // Default difficulty

document.querySelector(".score-value").textContent = score;

fetch("./data/cards.json")
  .then((res) => res.json())
  .then((data) => {
    cards = [...data, ...data];
    shuffleCards();
    revealAllCards();
    generateCards();
    showDifficulty();
  });


//Timer

function startTimer() {
  timer = setInterval(() => {
    document.querySelector(".timer").textContent = `Time Left: ${timeLeft}s`;
    timeLeft--;

    if (timeLeft < 0) {
      clearInterval(timer);
      endGame(false);
    }
  }, 1000);
}

//Game setup

function startGame() {
  openNamePopup();
}

function openNamePopup() {
  const namePopup = document.getElementById("namePopup");
  namePopup.style.display = "block";
}

function closeNamePopup() {
  const namePopup = document.getElementById("namePopup");
  namePopup.style.display = "none";
}

function submitPlayerName() {
  const playerNameInput = document.getElementById("playerNameInput");
  const playerName = playerNameInput.value.trim();

  sessionStorage.setItem("playerName", playerName);
  closeNamePopup();
  revealAllCards()
  startTimer(); // Start the timer after submitting the name
}

//Card setup

function shuffleCards() {
  let currentIndex = cards.length,
    randomIndex,
    temporaryValue;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = cards[currentIndex];
    cards[currentIndex] = cards[randomIndex];
    cards[randomIndex] = temporaryValue;
  }
}

function generateCards() {
  for (let card of cards) {
    const cardElement = document.createElement("div");
    cardElement.classList.add("card");
    cardElement.setAttribute("data-name", card.name);
    cardElement.innerHTML = `
      <div class="front">
        <img class="front-image" src=${card.image} />
      </div>
      <div class="back"></div>
    `;
    gridContainer.appendChild(cardElement);
    cardElement.addEventListener("click", flipCard);
  }
}

function revealAllCards() {
  const allCards = document.querySelectorAll(".card");
  allCards.forEach((card) => {
    card.classList.add("flipped");
  });

  setTimeout(() => {
    allCards.forEach((card) => {
      card.classList.remove("flipped");
    });
    resetBoard();
  }, 2000);
}

function flipCard() {
  if (lockBoard) return;
  if (this === firstCard) return;

  this.classList.add("flipped");

  if (!firstCard) {
    firstCard = this;
    return;
  }

  secondCard = this;
  document.querySelector(".score-value").textContent = score;
  lockBoard = true;

  checkForMatch();
}

function checkForMatch() {
  let isMatch = firstCard.dataset.name === secondCard.dataset.name;
  isMatch ? disableCards() : unflipCards();
}

function disableCards() {
  firstCard.removeEventListener("click", flipCard);
  secondCard.removeEventListener("click", flipCard);

  if (document.querySelectorAll(".card.flipped").length === cards.length - 2) {
    // If only two cards are left (the last pair)
    setTimeout(() => {
      flipLastPair();
    }, 1000);
  } else if (document.querySelectorAll(".card.flipped").length === cards.length) {
    // All cards are matched
    endGame(true);
  } else {
    // Give 10 points for a successful match
    score += 10;
    document.querySelector(".score-value").textContent = score;
    resetBoard();
  }
}

function flipLastPair() {
  const allCards = document.querySelectorAll(".card");
  allCards.forEach((card) => {
    card.classList.add("flipped");
  });

  setTimeout(() => {
    allCards.forEach((card) => {
      card.classList.remove("flipped");
    });
    endGame(true);
  }, 2000);
}

function unflipCards() {
  setTimeout(() => {
    firstCard.classList.remove("flipped");
    secondCard.classList.remove("flipped");

    // Deduct 2 points for an unsuccessful match
    score -= 2;
    document.querySelector(".score-value").textContent = score;
    resetBoard();
  }, 1000);
}

//End game

function endGame(isWinner) {
  clearInterval(timer);

  if (isWinner) {
    console.log("Updating leaderboard...");
    updateLeaderboard();
    showWin();
  } else {
    showLose();
  }
}

function showWin() {
  const win = document.getElementById("winWindow");
  win.style.display = "block";

  const scoreDisplay = win.querySelector(".score-display");
  scoreDisplay.textContent = `Your score: ${score}`;
}

function showLose() {
  const lose = document.getElementById("loseWindow");
  lose.style.display = "block";

  const scoreDisplay = lose.querySelector(".score-display");
  scoreDisplay.textContent = `Your score: ${score}`;
}

function closeWin() {
  const win = document.getElementById("winWindow");
  win.style.display = "none";
}

function closeLose() {
  const lose = document.getElementById("loseWindow");
  lose.style.display = "none";
}

//Restart 

function resetBoard() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function closeAll() {
  closeMenu();
  closeLose();
  closeWin();
}

function restart() {
  closeAll();
  clearInterval(timer); // Clear the existing interval
  resetBoard();
  shuffleCards();
  score = 0;
  document.querySelector(".score-value").textContent = score;

  // Use the currentDifficulty variable to set the initial timeLeft
  timeLeft = getTimeLimit(currentDifficulty);
  document.querySelector(".timer").textContent = `Time Left: ${timeLeft}s`;

  gridContainer.innerHTML = "";
  generateCards();
  startGame();
}

// Menu 

function showMenu() {
  const popupMenu = document.getElementById("popup-menu");
  popupMenu.style.display = "block";
  closeLose();
  closeWin();
}

function closeMenu() {
  const popupMenu = document.getElementById("popup-menu");
  popupMenu.style.display = "none";
}

function showDifficulty() {
  const popup = document.getElementById("difficulty-menu");
  popup.style.display = "block";
}

function closeDifficulty() {
  const popup = document.getElementById("difficulty-menu");
  popup.style.display = "none";
}

//Difficulty sets

function setDifficulty(difficulty) {
  closeDifficulty();
  currentDifficulty = difficulty;
  timeLeft = getTimeLimit(difficulty);
  document.querySelector(".timer").textContent = `Time Left: ${timeLeft}s`;
  restart();
}

function getTimeLimit(difficulty) {
  switch (difficulty) {
    case "easy":
      return 90;
    case "medium":
      return 60;
    case "hard":
      return 45;
    default:
      return 60; // Default to easy if an invalid difficulty is provided
  }
}

//Leaderboard

function updateLeaderboard() {
  const playerName = sessionStorage.getItem("playerName") || "Anonymous";
  const playerScore = score;

  // Retrieve existing leaderboard data from session storage
  const leaderboardData = JSON.parse(sessionStorage.getItem("leaderboard")) || {};

  // Ensure leaderboardData[currentDifficulty] is an array
  leaderboardData[currentDifficulty] = leaderboardData[currentDifficulty] || [];

  // Add the new score to the array
  leaderboardData[currentDifficulty].push({ name: playerName, score: playerScore });

  // Ensure leaderboardData[currentDifficulty] is an array
  if (!Array.isArray(leaderboardData[currentDifficulty])) {
    console.error('Invalid leaderboard data:', leaderboardData);
    return;
  }

  // Sort the array by score in descending order
  leaderboardData[currentDifficulty].sort((a, b) => b.score - a.score);

  // Keep only the top 5 scores
  leaderboardData[currentDifficulty] = leaderboardData[currentDifficulty].slice(0, 5);

  // Store the updated leaderboard data in session storage
  sessionStorage.setItem("leaderboard", JSON.stringify(leaderboardData));
}

function showLeaderboard() {
  const leaderboardPopup = document.getElementById("leaderboard");
  leaderboardPopup.style.display = "block";

  // Retrieve leaderboard data from session storage
  const leaderboardData = JSON.parse(sessionStorage.getItem("leaderboard")) || {};

  // Iterate through each difficulty level and update the corresponding list item
  ['easy', 'medium', 'hard'].forEach((difficulty) => {
    const leaderboardList = leaderboardPopup.querySelector(`#${difficulty}Leaderboard`);
    console.log('Leaderboard Data:', leaderboardData); // Add this line for debugging
    console.log('Current Difficulty:', difficulty); // Add this line for debugging

    if (leaderboardData[difficulty] && leaderboardData[difficulty].length > 0) {
      leaderboardList.innerHTML = ''; // Clear the previous content

      leaderboardData[difficulty].forEach((entry, index) => {
        const { name, score } = entry;
        leaderboardList.innerHTML += `<p>${index + 1}. ${name}: ${score}</p>`;
      });
    } else {
      leaderboardList.innerHTML = "<p>No data available</p>";
    }
  });
}


function closeLeaderboard() {
  const popup = document.getElementById("leaderboard");
  popup.style.display = "none";
}
