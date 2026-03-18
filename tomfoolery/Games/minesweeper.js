(function() {
    // ---------- constants & settings ----------
    let W = 9, H = 9, TOTAL_MINES = 10;
    let board = [];
    let gameActive = true;
    let gameWon = false;
    let flagsPlaced = 0;
    let timerInterval = null;
    let secondsElapsed = 0;
    let timerStarted = false;
    let cellsRevealed = 0;
    const leaderboard = [];

    // DOM elements
    const gridEl = document.getElementById('gridContainer');
    const mineDisplay = document.getElementById('mineDisplay');
    const timerDisplay = document.getElementById('timerDisplay');
    const resetBtn = document.getElementById('resetButton');
    const gridSizeInput = document.getElementById('gridSize');
    const numBombsInput = document.getElementById('numBombs');
    const leaderboardEl = document.getElementById('leaderboard');

    // Format 3-digit numbers
    const fmt = (n) => n.toString().padStart(3, '0').slice(0, 3);

    // Update mine counter
    function updateMineCounter() {
        let remaining = TOTAL_MINES - flagsPlaced;
        if (remaining < 0) remaining = 0;
        mineDisplay.innerText = fmt(remaining);
    }

    // Stop timer
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    // Start timer
    function startTimerOnFirstMove() {
        if (!timerStarted && gameActive && !gameWon) {
            timerStarted = true;
            timerInterval = setInterval(() => {
                secondsElapsed++;
                timerDisplay.innerText = fmt(secondsElapsed);
            }, 1000);
        }
    }

    // Reset the game
    function resetGame() {
        stopTimer();
        timerStarted = false;
        secondsElapsed = 0;
        timerDisplay.innerText = '000';
        gameActive = true;
        gameWon = false;
        flagsPlaced = 0;
        cellsRevealed = 0;
        updateMineCounter();

        board = Array(H).fill().map(() => Array(W).fill().map(() => ({
            mine: false,
            visible: false,
            flag: false,
            neighborMines: 0
        })));

        renderBoard();
        resetBtn.innerText = '😊';
    }

    // Neighbour offsets
    const dirs = [
        [-1,-1],[-1,0],[-1,1],
        [0,-1],       [0,1],
        [1,-1], [1,0], [1,1]
    ];

    // Compute neighbor counts
    function computeNeighbors() {
        for (let r = 0; r < H; r++) {
            for (let c = 0; c < W; c++) {
                if (board[r][c].mine) continue;
                let cnt = 0;
                for (let [dr, dc] of dirs) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < H && nc >= 0 && nc < W && board[nr][nc].mine) cnt++;
                }
                board[r][c].neighborMines = cnt;
            }
        }
    }

    // Place mines
    function placeMinesAvoidFirst(firstRow, firstCol) {
        let minesPlaced = 0;
        while (minesPlaced < TOTAL_MINES) {
            const r = Math.floor(Math.random() * H);
            const c = Math.floor(Math.random() * W);
            if ((r === firstRow && c === firstCol) || board[r][c].mine) continue;
            board[r][c].mine = true;
            minesPlaced++;
        }
        computeNeighbors();
    }

    // Reveal cell
    function revealCell(row, col) {
        if (!gameActive || gameWon) return false;
        const cell = board[row][col];
        if (cell.visible || cell.flag) return false;

        const firstMove = !timerStarted && !cell.visible;
        if (firstMove) {
            placeMinesAvoidFirst(row, col);
            startTimerOnFirstMove();
        }

        if (cell.mine) {
            gameActive = false;
            stopTimer();
            for (let r = 0; r < H; r++) {
                for (let c = 0; c < W; c++) {
                    if (board[r][c].mine) board[r][c].visible = true;
                }
            }
            cell.visible = true;
            renderBoard();
            resetBtn.innerText = '💥';
            return false;
        }

        const stack = [[row, col]];
        while (stack.length) {
            const [r, c] = stack.pop();
            const cur = board[r][c];
            if (cur.visible || cur.flag) continue;
            cur.visible = true;
            cellsRevealed++;

            if (cur.neighborMines === 0) {
                for (let [dr, dc] of dirs) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < H && nc >= 0 && nc < W && !board[nr][nc].visible && !board[nr][nc].flag) {
                        stack.push([nr, nc]);
                    }
                }
            }
        }

        const totalNonMines = W * H - TOTAL_MINES;
        if (cellsRevealed === totalNonMines && gameActive) {
            gameWon = true;
            gameActive = false;
            stopTimer();
            for (let r = 0; r < H; r++) {
                for (let c = 0; c < W; c++) {
                    if (board[r][c].mine && !board[r][c].flag) {
                        board[r][c].flag = true;
                    }
                }
            }
            flagsPlaced = TOTAL_MINES;
            updateMineCounter();
            const playerName = prompt("Congratulations! Enter your name for the leaderboard:", "Player");
            if (playerName) {
                leaderboard.push({
                    name: playerName,
                    time: secondsElapsed,
                    size: `${W}x${H}`,
                    bombs: TOTAL_MINES
                });
                leaderboard.sort((a, b) => b.time - a.time); // Sort by descending time
                renderLeaderboard();
            }
            resetBtn.innerText = '😎';
            renderBoard();
            return true;
        }

        renderBoard();
        return true;
    }

    // Toggle flag
    function toggleFlag(row, col) {
        if (!gameActive || gameWon) return false;
        const cell = board[row][col];
        if (cell.visible) return false;

        if (!cell.flag && flagsPlaced >= TOTAL_MINES) return;
        cell.flag = !cell.flag;
        flagsPlaced += cell.flag ? 1 : -1;
        updateMineCounter();
        renderBoard();
        return false;
    }

    // Render grid
    function renderBoard() {
        let html = '';
        for (let r = 0; r < H; r++) {
            for (let c = 0; c < W; c++) {
                const cell = board[r][c];
                let classes = 'cell';
                if (cell.visible) classes += ' visible';
                if (cell.visible && cell.mine) classes += ' mine';
                if (cell.visible && !cell.mine && cell.neighborMines > 0) classes += ` c${cell.neighborMines}`;
                
                let content = '';
                if (cell.visible && !cell.mine) {
                    content = cell.neighborMines === 0 ? '' : cell.neighborMines;
                } else if (cell.flag) {
                    classes += ' flag';
                }

                html += `<div class="${classes}" data-row="${r}" data-col="${c}">${content}</div>`;
            }
        }
        gridEl.innerHTML = html;
    }

    // Render leaderboard
    function renderLeaderboard() {
        leaderboardEl.innerHTML = '';
        for (const entry of leaderboard) {
            const li = document.createElement("li");
            li.innerText = `${entry.name}: ${entry.time}s | Size: ${entry.size} | Bombs: ${entry.bombs}`;
            leaderboardEl.appendChild(li);
        }
    }

    // Event handlers
    function handleLeftClick(row, col) {
        if (!gameActive || gameWon) return;
        const cell = board[row][col];
        if (cell.flag) return;
        revealCell(row, col);
    }

    function handleRightClick(row, col, e) {
        e.preventDefault();
        toggleFlag(row, col);
    }

    // Global click listener
    gridEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const cellDiv = e.target.closest('.cell');
        if (!cellDiv) return;
        const row = parseInt(cellDiv.dataset.row, 10);
        const col = parseInt(cellDiv.dataset.col, 10);
        if (e.button === 0) { // left
            handleLeftClick(row, col);
        } else if (e.button === 2) { // right
            handleRightClick(row, col, e);
        }
    });

    // Disable browser context menu
    gridEl.addEventListener('contextmenu', (e) => e.preventDefault());

    // Start game button
    document.getElementById('startGame').addEventListener('click', () => {
        W = parseInt(gridSizeInput.value, 10);
        H = W; // Set Height equal to Width for a square grid
        TOTAL_MINES = parseInt(numBombsInput.value, 10);
        resetGame();
    });

    // Reset button
    resetBtn.addEventListener('click', () => {
        resetGame();
    });

    // Initial reset
    resetGame();
})();
