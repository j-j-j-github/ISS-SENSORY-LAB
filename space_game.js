// space_game.js
// Space EVA Game module
// This script runs the game logic, drawing, and input handling on the canvas.

(() => {
    // Config
    const ROCKET_PATH = './public/game/iss.png';
    const ASTRONAUT_PATH = './public/game/me.png';
    const OBSTACLE_PATHS = [
      './public/game/obstacle1.png',
      './public/game/obstacle2.png',
      './public/game/obstacle3.png'
    ];
    const CANVAS_ID = 'space-game-canvas';
    const MSG_ID = 'space-game-message'; 
    
    const GAME_DURATION = 20; // Seconds

    // State
    let canvas, ctx;
    let lastTime = 0;
    let animationFrameId = null; // Used to cancel the loop when game ends/resets
    let running = false;
    let timeRemaining = GAME_DURATION;
    let timeStart = 0; // Timestamp when game started, used for meter calculation
    let timerInterval = null;
    let controlMessage = ''; // For displaying Lift/Ballast status
    let gameStateMessage = ''; // For displaying WIN/DIED message inside canvas
  
    // astronaut box in world coords
    const astronaut = {
      x: 50,
      y: 150,
      width: 60, // SIZEOFOBJECT
      height: 85, // SIZEOFOBJECT
      speed: 180 // px / second
    };
  
    // images
    let rocketImg = null;
    let obstacleImgs = [];
    let astronautImg = null;
  
    // obstacles array
    // { x, y, width, height, speed, img, angle, angularSpeed }
    let obstacles = [];
  
    // input
    const keys = {};
  
    // spawn control
    let spawnCooldown = 0;
  
    // stars (for background twinkle)
    const stars = [];
    const STAR_COUNT = 80;
  
    // Helpers
    function preloadImage(path) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(new Error('Failed to load ' + path));
        img.src = path;
      });
    }
  
    async function preloadAssets() {
      // ISS (Rocket)
      rocketImg = await preloadImage(ROCKET_PATH);
  
      // Obstacles
      const promises = OBSTACLE_PATHS.map(p => preloadImage(p));
      obstacleImgs = await Promise.all(promises);
      
      // Astronaut (me.png)
      astronautImg = await preloadImage(ASTRONAUT_PATH);
    }
  
    // Initialize stars (must be called when canvas is sized)
    function initStars(width, height) {
      stars.length = 0;
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          baseAlpha: 0.4 + Math.random() * 0.6,
          phase: Math.random() * Math.PI * 2,
          size: Math.random() > 0.9 ? 2.5 : (Math.random() > 0.8 ? 2 : 1)
        });
      }
    }

    // Draws the twinkling star field background
    function drawTwinklingStars(ts, w, h) {
        // Clear background (space)
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, w, h);

        // Draw twinkling stars
        for (let s of stars) {
            // Calculate twinkling alpha based on time
            const alpha = s.baseAlpha * (0.6 + 0.4 * Math.sin((ts / 400) + s.phase));
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        }
    }
  
    // Spawn an obstacle
    function spawnObstacle(canvasW, canvasH) {
        const img = obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)];
        const size = 40 + Math.random() * 60; // 40–100px
        const y = Math.random() * (canvasH - size);
        // Increased speed by 1.5x: (120*1.5) + rand * (100*1.5) = 180 + rand * 150
        const speed = 180 + Math.random() * 150; // px/sec 
        const angularSpeed = (Math.random() * 90 - 45) * (Math.PI / 180); // rotation speed
      
        // Prevent spawning too close to last obstacle
        if (obstacles.length > 0) {
          const last = obstacles[obstacles.length - 1];
          if (last.x > canvasW - 250) { // require at least 250px spacing
            return;
          }
        }
      
        obstacles.push({
          x: canvasW + 20,
          y,
          width: size,
          height: size,
          speed,
          img,
          angle: Math.random() * Math.PI * 2,
          angularSpeed
        });
      }
      
  
    // Input handlers
    function onKeyDown(e) {
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        e.preventDefault(); // prevent scrolling right here
      }
      keys[e.key] = true;
      if (e.key === 'ArrowUp') controlMessage = '[ LIFT ACTIVATED ] : Rising in Altitude';
      else if (e.key === 'ArrowDown') controlMessage = '[ BALLAST ACTIVATED ] : Descending in Altitude';
    }
    function onKeyUp(e) {
      keys[e.key] = false;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') controlMessage = '';
    }

    function addInputListeners() {
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
    }

    function removeInputListeners() {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
    }
  
    // Simple 1-second interval update for time display and game end
    function startTimerLogic() {
      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        if (!running) return;
        timeRemaining--;
        if (timeRemaining <= 0) {
          timeRemaining = 0;
          endGame(false);
        }
      }, 1000);
    }
    
    // Helper function to draw the end game message and overlay
    function drawEndScreen(w, h, msg) {
        // Draw final state overlay (dims the entire frame)
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, w, h);

        // Draw the WIN/DIED message prominently in the CENTER of the frame
        ctx.font = 'bold 80px Inter, sans-serif'; // Large font for impact
        ctx.fillStyle = (msg === 'YOU WIN!') ? 'lime' : 'red';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle'; // Anchor text vertically in the middle
        
        const centerX = w / 2;
        const centerY = h / 2; 

        // Draw a dark outline for maximum visibility against any background
        ctx.lineWidth = 8;
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.strokeText(msg, centerX, centerY);
        
        // Draw the main text
        ctx.fillText(msg, centerX, centerY);

        // Draw the oxygen meter one last time
        drawOxygenMeter(w, h);
    }
  
    // End game (win=null means a forced reset without displaying WIN/LOSE message)
    function endGame(win) {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null; // Stops the loop completely
      }

      running = false;
      clearInterval(timerInterval);
      removeInputListeners();
  
      if (win !== null) {
        // Set the in-game message
        gameStateMessage = win ? 'YOU WIN!' : 'YOU DIED!';

        // Clear external message (if any)
        const msgEl = document.getElementById(MSG_ID);
        if (msgEl) {
          msgEl.textContent = '';
        }

        // FIX: Immediately draw the final screen to ensure visibility
        if (canvas && ctx) {
            // Use a tiny delay (0ms) to ensure the current frame finishes before drawing the overlay
            setTimeout(() => {
                 drawEndScreen(canvas.width, canvas.height, gameStateMessage);
            }, 0);
        }
      }
    }

    // Draws the large "PLAY THE GAME" message on a starry screen
    function drawInitialScreen(ts) {
        if (!canvas || !ctx) return;
        
        const w = canvas.width;
        const h = canvas.height;

        // Draw the starry background
        drawTwinklingStars(ts || 0, w, h);

        // Draw message
        ctx.font = 'bold 48px Inter, sans-serif';
        ctx.fillStyle = 'lime';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PLAY THE GAME', w / 2, h / 2);

        // Keep the stars twinkling until game starts
        if (!running) {
             animationFrameId = requestAnimationFrame(drawInitialScreen);
        }
    }
  
    // AABB collision check
    function collides(a, b) {
      return !(a.x + a.width < b.x ||
               a.x > b.x + b.width ||
               a.y + a.height < b.y ||
               a.y > b.y + b.height);
    }

    // Draws the Oxygen Meter in the bottom right corner
    function drawOxygenMeter(w, h) {
        // Meter dimensions
        const meterW = 120;
        const meterH = 20;
        const padding = 18; // slightly larger margin
        const meterX = w - meterW - padding;
        const meterY = h - meterH - padding;

        // Calculate current meter width based on remaining time (smooth)
        const timePassed = (Date.now() - timeStart) / 1000;
        let currentFillRatio = 1.0 - (timePassed / GAME_DURATION);
        if (!running) currentFillRatio = timeRemaining / GAME_DURATION; // Use discrete steps when paused
        currentFillRatio = Math.max(0, Math.min(1, currentFillRatio));
        
        const currentFillW = meterW * currentFillRatio;

        // Draw background container (frame)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(meterX, meterY, meterW, meterH);

        // Determine color (based on timeRemaining for discrete thresholds)
        let barColor = 'rgba(0, 200, 255, 1)'; // Blue for normal
        if (timeRemaining <= 5) {
            barColor = 'rgba(255, 0, 0, 1)'; // Red for critical
        } else if (timeRemaining <= 10) {
            barColor = 'rgba(255, 140, 0, 1)'; // Orange/Yellow for caution
        }

        // Draw filled meter
        ctx.fillStyle = barColor;
        ctx.fillRect(meterX, meterY, currentFillW, meterH);

        // Draw label (Fixed font size to prevent jumping)
        ctx.font = 'bold 12px monospace'; 
        ctx.fillStyle = 'white';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        const labelX = meterX + meterW; // anchored to right edge of meter
        const labelY = meterY - 6; // fixed gap above meter
        ctx.fillText(`OXYGEN: ${timeRemaining}s`, labelX, labelY);

        // Draw border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(meterX, meterY, meterW, meterH);
    }
  
    // Main loop
    function loop(ts) {
      if (!running) {
          // If the game ended, redraw the final message on every frame if needed
          if (gameStateMessage) {
            drawEndScreen(canvas.width, canvas.height, gameStateMessage);
          }
          // Keep rendering the static end screen so it stays visible
          animationFrameId = requestAnimationFrame(loop); 
          return;
      }

      // Game is running
      if (!lastTime) lastTime = ts;
      const dt = (ts - lastTime) / 1000; // seconds
      lastTime = ts;
  
      const w = canvas.width;
      const h = canvas.height;
  
      // Draw background
      drawTwinklingStars(ts, w, h);
  
      // Draw ISS
      const rocketH = canvas.height * 0.4;
      const rocketW = rocketH * (rocketImg.width / rocketImg.height);
      const rocketX = canvas.width - rocketW - 40;
      const rocketY = (canvas.height / 2) - (rocketH / 2);
      ctx.drawImage(rocketImg, rocketX, rocketY, rocketW, rocketH);
  
      // Move astronaut
      if (keys['ArrowUp']) astronaut.y -= astronaut.speed * dt;
      if (keys['ArrowDown']) astronaut.y += astronaut.speed * dt;
      if (keys['ArrowLeft']) astronaut.x -= astronaut.speed * dt;
      if (keys['ArrowRight']) astronaut.x += astronaut.speed * dt;
  
      // Boundaries
      if (astronaut.y < 0) astronaut.y = 0;
      if (astronaut.y + astronaut.height > h) astronaut.y = h - astronaut.height;
      if (astronaut.x < 0) astronaut.x = 0;
      if (astronaut.x + astronaut.width > w) astronaut.x = w - astronaut.width;
  
      // Draw astronaut image (me.png)
      if (astronautImg) {
        ctx.drawImage(astronautImg, astronaut.x, astronaut.y, astronaut.width, astronaut.height);
      }
  
      // Spawn/Update obstacles
      spawnCooldown -= dt;
      if (spawnCooldown <= 0) {
        spawnCooldown = 0.35 + Math.random() * 0.9;
        spawnObstacle(w, h);
      }
  
      for (let obs of obstacles) {
        obs.x -= obs.speed * dt;
        obs.angle += obs.angularSpeed * dt;
        const cx = obs.x + obs.width / 2;
        const cy = obs.y + obs.height / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(obs.angle);
        ctx.drawImage(obs.img, -obs.width / 2, -obs.height / 2, obs.width, obs.height);
        ctx.restore();
      }
  
      obstacles = obstacles.filter(o => (o.x + o.width) > -50);
  
      // Collision Checks
      // 1. Astronaut Hitbox (slight reduction for cleaner collision with obstacles)
      const astroBox = {
          x: astronaut.x + astronaut.width * 0.1,
          y: astronaut.y + astronaut.height * 0.1,
          width: astronaut.width * 0.8,
          height: astronaut.height * 0.8
        };
      
      // Check collision with obstacles
      for (let obs of obstacles) {
        const obsBox = {
          x: obs.x + obs.width * 0.1,
          y: obs.y + obs.height * 0.1,
          width: obs.width * 0.8,
          height: obs.height * 0.8
        };
        
        if (collides(astroBox, obsBox)) {
          endGame(false);
          return;
        }
      }
      
      // 2. Win Collision Check with ISS (FIXED: Tighter Hitbox)
      
      // We reduce the ISS hitbox to ignore transparent padding around the image.
      // Adjust these values if the ISS image still seems too 'cushioned'.
      const issPaddingX = rocketW * 0.2; // 20% horizontal reduction on each side (40% total)
      const issPaddingY = rocketH * 0.15; // 15% vertical reduction on each side (30% total)

      const rocketBox = { 
          x: rocketX + issPaddingX, 
          y: rocketY + issPaddingY, 
          width: rocketW - (issPaddingX * 2), 
          height: rocketH - (issPaddingY * 2) 
      };

      if (collides(astroBox, rocketBox)) {
          endGame(true);
          return;
      }

      // --- UI Elements ---

      // 3. Low Oxygen Warning (Top Right) - Starts at 10s
      if (timeRemaining <= 10 && timeRemaining > 0) {
        const warningText = timeRemaining;
        const alpha = 0.5 + 0.5 * Math.abs(Math.sin(ts / 150));
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
        
        // Fixed positioning for countdown
        ctx.font = 'bold 64px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(warningText, w - 24, 12);
      }

      // 4. Control Message (Bottom Left)
      if (controlMessage) {
        ctx.font = 'bold 16px monospace'; 
        ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(controlMessage, 10, h - 10);
      }

      // 5. Oxygen Meter (Bottom Right)
      drawOxygenMeter(w, h);
  
      // Next frame
      animationFrameId = requestAnimationFrame(loop);
    }
  
    // Public start function
    async function startSpaceGamePublic() {
      try {
        // --- STEP 1: Full Reset ---
        endGame(null); // Stop any running loop (initial screen or previous game)
        
        for (const key in keys) { delete keys[key]; }
        controlMessage = '';
        gameStateMessage = '';
        
        // Grab canvas and context
        canvas = document.getElementById(CANVAS_ID);
        if (!canvas) {
          console.error('Canvas not found:', CANVAS_ID);
          return;
        }
        ctx = canvas.getContext('2d');
  
        // size canvas responsively
        const parent = canvas.parentElement;
        const maxW = Math.min(1100, parent ? parent.clientWidth - 32 : 900);
        canvas.width = Math.max(700, maxW);
        canvas.height = 420;
  
        // Reset game state variables
        running = true;
        lastTime = 0;
        timeRemaining = GAME_DURATION;
        timeStart = Date.now(); 
        obstacles = [];
        spawnCooldown = 0.5;
        astronaut.x = 50;
        astronaut.y = (canvas.height / 2) - (astronaut.height / 2);
  
        // Preload assets
        if (!rocketImg || obstacleImgs.length === 0 || !astronautImg) {
          await preloadAssets();
        }
  
        // re-init stars in case canvas size changed
        initStars(canvas.width, canvas.height);
  
        // attach input handlers
        addInputListeners();
          
        // start timer logic (for discrete 1s timeRemaining updates)
        startTimerLogic();
        
        // start the main loop (for drawing and smooth meter animation)
        animationFrameId = requestAnimationFrame(loop);
  
        // clear any external message
        const msgEl = document.getElementById(MSG_ID);
        if (msgEl) {
          msgEl.textContent = '';
        }
      } catch (err) {
        console.error('Failed to start space game:', err);
        const msgEl = document.getElementById(MSG_ID);
        if (msgEl) {
          msgEl.textContent = 'ERROR: Could not start game. See console.';
          msgEl.style.color = 'red';
        }
      }
    }
  
    // expose start function globally
    window.startSpaceGame = startSpaceGamePublic;

    // Initial draw setup when the script loads
    window.addEventListener('load', () => {
        canvas = document.getElementById(CANVAS_ID);
        if (canvas) {
            ctx = canvas.getContext('2d');
            // size canvas responsively
            const parent = canvas.parentElement;
            const maxW = Math.min(1100, parent ? parent.clientWidth - 32 : 900);
            canvas.width = Math.max(700, maxW);
            canvas.height = 420;
            
            // Must init stars for the initial screen draw
            initStars(canvas.width, canvas.height); 
            
            // Start the initial screen loop for twinkling stars
            drawInitialScreen(); 
        }
    });
  })();
