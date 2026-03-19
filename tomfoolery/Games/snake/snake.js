// snake.js - with non-intrusive pause
(() => {
    // ----- config & globals -----
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreSpan = document.getElementById('scoreDisplay');
    const speedTimerSpan = document.getElementById('speedTimer');
    const doubleTimerSpan = document.getElementById('doubleTimer');
    const gameOverModal = document.getElementById('gameOverModal');
    const pauseOverlay = document.getElementById('pauseOverlay');
    const finalScoreSpan = document.getElementById('finalScoreSpan');
    const playerNameInput = document.getElementById('playerNameInput');
    const saveBtn = document.getElementById('saveScoreBtn');
    const restartBtn = document.getElementById('restartFromOverBtn');
    const leaderboardRows = document.getElementById('leaderboardRows');
    const clearBoardBtn = document.getElementById('clearLeaderboardBtn');

    const GRID_SIZE = 20;          // 20x20 cells
    const CELL_SIZE = 20;           // 400/20
    const INIT_SPEED_MS = 150;      // base speed
    let gameInterval = null;
    let gameActive = false;
    let gamePaused = false;
    let gameOverFlag = false;

    // snake & food
    let snake = [
        {x: 10, y: 10},
        {x: 9, y: 10},
        {x: 8, y: 10},
        {x: 7, y: 10}  // initial length 4
    ];
    let direction = 'RIGHT'; // current moving direction
    let nextDirection = 'RIGHT';
    let food = {x: 15, y: 10, type: 'red'}; // red, blue, yellow, orange

    // scoring & timers
    let score = 0;
    let speedMultiplier = 1.0;           // 1.0 = normal
    let pointMultiplier = 1.0;            // 1.0 = normal, 2.0 when orange active
    let speedTimerSeconds = 0;             // countdown for yellow effect
    let doubleTimerSeconds = 0;            // countdown for orange effect
    let gameStartTime = Date.now();        // for total time taken (final)

    // leaderboard key
    const STORAGE_KEY = 'googleSnakeLeaderboard';

    // ----- helper functions -----
    function updateScoreUI() {
        scoreSpan.textContent = score;
    }

    function updateTimersUI() {
        speedTimerSpan.textContent = speedTimerSeconds > 0 ? `⚡ ${speedTimerSeconds}s` : '⚡ — s';
        doubleTimerSpan.textContent = doubleTimerSeconds > 0 ? `✨ ${doubleTimerSeconds}s` : '✨ — s';
    }

    // countdown decrement (called every second)
    function handleTimers() {
        if (!gameActive || gamePaused) return;

        let changed = false;
        if (speedTimerSeconds > 0) {
            speedTimerSeconds--;
            if (speedTimerSeconds <= 0) {
                speedMultiplier = 1.0;
                speedTimerSeconds = 0;
                adjustInterval();
            }
            changed = true;
        }
        if (doubleTimerSeconds > 0) {
            doubleTimerSeconds--;
            if (doubleTimerSeconds <= 0) {
                pointMultiplier = 1.0;
                doubleTimerSeconds = 0;
            }
            changed = true;
        }
        if (changed) {
            updateTimersUI();
        }
    }

    setInterval(() => {
        if (gameActive && !gamePaused) {
            handleTimers();
        }
    }, 1000);

    // adjust game speed based on multiplier
    function adjustInterval() {
        if (!gameActive || gamePaused) return;
        if (gameInterval) {
            clearInterval(gameInterval);
        }
        let newDelay = INIT_SPEED_MS / speedMultiplier;
        newDelay = Math.min(220, Math.max(40, newDelay)); // keep reasonable
        gameInterval = setInterval(updateGame, newDelay);
    }

    // pause/unpause function - now non-intrusive
    function togglePause() {
        if (!gameActive || gameOverFlag) return; // can't pause if game over or not active
        
        gamePaused = !gamePaused;
        
        if (gamePaused) {
            // pause the game
            if (gameInterval) {
                clearInterval(gameInterval);
                gameInterval = null;
            }
            pauseOverlay.classList.add('show');
        } else {
            // unpause
            pauseOverlay.classList.remove('show');
            adjustInterval(); // restart the game loop
        }
        
        drawCanvas(); // redraw (without overlay effect)
    }

    // generate random fruit with weighted types
    function generateRandomFood() {
        const rand = Math.random();
        let type;
        if (rand < 0.5) type = 'red';        // 50% red
        else if (rand < 0.75) type = 'blue';  // 25% blue
        else if (rand < 0.9) type = 'yellow'; // 15% yellow
        else type = 'orange';                 // 10% orange

        let newFood = null;
        let attempts = 0;
        const maxAttempts = 1000;
        while (!newFood && attempts < maxAttempts) {
            const fx = Math.floor(Math.random() * GRID_SIZE);
            const fy = Math.floor(Math.random() * GRID_SIZE);
            if (!snake.some(segment => segment.x === fx && segment.y === fy)) {
                newFood = {x: fx, y: fy, type};
            }
            attempts++;
        }
        if (newFood) food = newFood;
        else {
            // if board nearly full? just put somewhere (edge case)
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    if (!snake.some(s => s.x === x && s.y === y)) {
                        food = {x, y, type};
                        return;
                    }
                }
            }
            // absolutely full -> you win condition? rare, but set gameover as win?
            gameActive = false;
            gameOver('win');
        }
    }

    // move snake and handle collisions / food
    function updateGame() {
        if (!gameActive || gamePaused) return;

        // apply queued direction
        direction = nextDirection;

        // compute new head
        const head = snake[0];
        let newHead = {...head};
        if (direction === 'RIGHT') newHead.x += 1;
        else if (direction === 'LEFT') newHead.x -= 1;
        else if (direction === 'UP') newHead.y -= 1;
        else if (direction === 'DOWN') newHead.y += 1;

        // wall collision?
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
            gameOver('wall');
            return;
        }

        // check if food eaten
        const isEating = (newHead.x === food.x && newHead.y === food.y);

        // create new snake array
        let newSnake = [newHead, ...snake];

        if (!isEating) {
            newSnake.pop(); // remove tail
        }

        // after moving (and possible removal) check if head collides with body
        const headCollision = newSnake.slice(1).some(seg => seg.x === newHead.x && seg.y === newHead.y);
        if (headCollision) {
            gameOver('body');
            return;
        }

        // apply snake
        snake = newSnake;

        if (isEating) {
            // apply fruit points & effect
            let basePoints = 0;
            const type = food.type;
            if (type === 'red') basePoints = 1;
            else if (type === 'blue') basePoints = 5;
            else if (type === 'yellow') {
                basePoints = 0; // no points, but effect
                speedMultiplier = 1.2;
                speedTimerSeconds = 20;
                adjustInterval();
            } else if (type === 'orange') {
                basePoints = 0;
                pointMultiplier = 2.0;
                doubleTimerSeconds = 20;
            }

            // apply point multiplier (orange effect)
            const pointsEarned = Math.floor(basePoints * pointMultiplier);
            score += pointsEarned;

            updateScoreUI();
            updateTimersUI();

            // generate new food
            generateRandomFood();
        }

        drawCanvas();
    }

    // game over handler
    function gameOver(reason) {
        if (!gameActive) return;
        gameActive = false;
        gameOverFlag = true;
        gamePaused = false; // ensure pause is off
        pauseOverlay.classList.remove('show'); // hide pause if showing
        
        if (gameInterval) {
            clearInterval(gameInterval);
            gameInterval = null;
        }
        finalScoreSpan.textContent = score;
        gameOverModal.classList.add('show');
        drawCanvas(); // final frame
    }

    // restart logic (without saving)
    function restartGame() {
        if (gameInterval) clearInterval(gameInterval);
        
        gameActive = true;
        gamePaused = false;
        gameOverFlag = false;
        gameOverModal.classList.remove('show');
        pauseOverlay.classList.remove('show');

        // reset state
        snake = [
            {x: 10, y: 10},
            {x: 9, y: 10},
            {x: 8, y: 10},
            {x: 7, y: 10}
        ];
        direction = 'RIGHT';
        nextDirection = 'RIGHT';
        score = 0;
        speedMultiplier = 1.0;
        pointMultiplier = 1.0;
        speedTimerSeconds = 0;
        doubleTimerSeconds = 0;

        updateScoreUI();
        updateTimersUI();
        gameStartTime = Date.now();

        generateRandomFood(); // first food
        adjustInterval(); // sets interval with speed 1.0
        drawCanvas();
    }

    // drawing with visual candy
    function drawCanvas() {
        ctx.clearRect(0, 0, 400, 400);
        // background grid
        ctx.fillStyle = '#1f3d2f';
        ctx.fillRect(0, 0, 400, 400);
        ctx.strokeStyle = '#3b6748';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath();
            ctx.strokeStyle = '#3f7051';
            ctx.lineWidth = 0.3;
            ctx.moveTo(i * CELL_SIZE, 0);
            ctx.lineTo(i * CELL_SIZE, 400);
            ctx.stroke();
            ctx.moveTo(0, i * CELL_SIZE);
            ctx.lineTo(400, i * CELL_SIZE);
            ctx.stroke();
        }

        // draw snake (rounded segments)
        snake.forEach((seg, idx) => {
            const isHead = idx === 0;
            const x = seg.x * CELL_SIZE, y = seg.y * CELL_SIZE;
            ctx.shadowColor = '#b3ffb3';
            ctx.shadowBlur = isHead ? 12 : 5;
            ctx.fillStyle = isHead ? '#b0f7b0' : '#6cc084';
            ctx.beginPath();
            ctx.roundRect(x+2, y+2, CELL_SIZE-4, CELL_SIZE-4, 6);
            ctx.fill();
            if (isHead) {
                ctx.fillStyle = '#ffffff90';
                ctx.beginPath();
                ctx.arc(x+12, y+8, 3, 0, 2*Math.PI);
                ctx.fill();
            }
        });
        ctx.shadowBlur = 0;

        // draw food
        if (food) {
            let gradient;
            const fx = food.x * CELL_SIZE + 2, fy = food.y * CELL_SIZE + 2, fw = CELL_SIZE-4;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#fafac0';
            if (food.type === 'red') {
                gradient = ctx.createRadialGradient(fx+6, fy+6, 2, fx+12, fy+12, 14);
                gradient.addColorStop(0, '#ffb2b2');
                gradient.addColorStop(1, '#dc143c');
            } else if (food.type === 'blue') {
                gradient = ctx.createRadialGradient(fx+6, fy+6, 2, fx+12, fy+12, 14);
                gradient.addColorStop(0, '#aac9ff');
                gradient.addColorStop(1, '#2f4f9e');
            } else if (food.type === 'yellow') {
                gradient = ctx.createRadialGradient(fx+6, fy+6, 2, fx+12, fy+12, 14);
                gradient.addColorStop(0, '#fcf0a0');
                gradient.addColorStop(1, '#cc9c1a');
            } else if (food.type === 'orange') {
                gradient = ctx.createRadialGradient(fx+6, fy+6, 2, fx+12, fy+12, 14);
                gradient.addColorStop(0, '#ffcf8a');
                gradient.addColorStop(1, '#e07c1f');
            }
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(fx+8, fy+8, 8, 8, 0, 0, 2*Math.PI);
            ctx.fill();
            // highlight
            ctx.fillStyle = '#fff9e0b0';
            ctx.beginPath();
            ctx.arc(fx+5, fy+5, 3, 0, 2*Math.PI);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    // helper canvas roundRect
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        return this;
    };

    // keyboard handling
    window.addEventListener('keydown', (e) => {
        const key = e.key;
        
        // Prevent default for game controls
        if (key.startsWith('Arrow') || key === ' ' || key === 'p' || key === 'P') {
            e.preventDefault();
        }

        // Pause toggle (Space or P)
        if (key === ' ' || key === 'p' || key === 'P') {
            togglePause();
            return;
        }

        // Direction keys - only if game is active and not paused
        if (!gameActive || gamePaused) return;

        if (key === 'ArrowUp' && direction !== 'DOWN') nextDirection = 'UP';
        else if (key === 'ArrowDown' && direction !== 'UP') nextDirection = 'DOWN';
        else if (key === 'ArrowLeft' && direction !== 'RIGHT') nextDirection = 'LEFT';
        else if (key === 'ArrowRight' && direction !== 'LEFT') nextDirection = 'RIGHT';
    });

    // leaderboard functions
    function getLeaderboard() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    function saveLeaderboardEntry(name, score, timeSec) {
        const board = getLeaderboard();
        board.push({ name: name.trim() || 'Anonymous', score: score, time: timeSec });
        // sort: highest score first, then lowest time
        board.sort((a, b) => {
            if (a.score !== b.score) return b.score - a.score;
            else return a.time - b.time;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
        renderLeaderboard();
    }

    function renderLeaderboard() {
        const board = getLeaderboard();
        let html = '';
        board.slice(0, 10).forEach(entry => {
            html += `<tr><td>${escapeHtml(entry.name)}</td><td>${entry.score}</td><td>${entry.time}</td></tr>`;
        });
        if (board.length === 0) html = '<tr><td colspan="3" style="text-align:center;">— no scores yet —</td></tr>';
        leaderboardRows.innerHTML = html;
    }

    function escapeHtml(unsafe) {
        return unsafe.replace(/[&<>"]/g, function(m) {
            if(m === '&') return '&amp;'; if(m === '<') return '&lt;'; if(m === '>') return '&gt;'; if(m === '"') return '&quot;';
            return m;
        });
    }

    // modal actions
    saveBtn.addEventListener('click', () => {
        const name = playerNameInput.value.trim() || 'Anonymous';
        const timeTaken = Math.floor((Date.now() - gameStartTime) / 1000);
        saveLeaderboardEntry(name, score, timeTaken);
        gameOverModal.classList.remove('show');
        restartGame(); // fresh start after saving
    });

    restartBtn.addEventListener('click', () => {
        gameOverModal.classList.remove('show');
        restartGame();
    });

    clearBoardBtn.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY);
        renderLeaderboard();
    });

    // initialise
    renderLeaderboard();
    restartGame();
})();