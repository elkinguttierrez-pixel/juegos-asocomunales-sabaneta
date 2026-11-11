import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Allow CORS for local dev and GitHub Pages production
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors({ origin: '*' }));
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const BASELINE_FILE = path.join(DATA_DIR, 'baseline.json');

const COORDINATOR_PIN = process.env.COORDINATOR_PIN || '2026';

// Initialize or load database
let db = {
  jacs: [],
  athletes: [],
  registrations: [],
  matches: [],
  medals: {}
};

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(raw);
      console.log(`📦 Datos cargados desde db.json (${db.matches.length} partidos, ${db.athletes.length} deportistas, ${db.registrations.length} planillas)`);
    } else if (fs.existsSync(BASELINE_FILE)) {
      const raw = fs.readFileSync(BASELINE_FILE, 'utf8');
      db = JSON.parse(raw);
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
      console.log(`🌱 Base de datos inicializada desde baseline.json con ${db.athletes.length} deportistas y ${db.registrations.length} planillas`);
    } else {
      console.warn('⚠️ No se encontró db.json ni baseline.json');
    }
  } catch (err) {
    console.error('Error al cargar la base de datos:', err);
  }
}

function saveDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Error al guardar db.json:', err);
  }
}

loadDatabase();

// REST ENDPOINTS
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Juegos Asocomunales Sabaneta 2026 - Realtime API',
    timestamp: new Date().toISOString(),
    matchesCount: db.matches.length,
    connectedSockets: io.engine.clientsCount
  });
});

app.get('/api/state', (req, res) => {
  res.json({
    matches: db.matches,
    medals: db.medals,
    registrations: db.registrations,
    athletes: db.athletes,
    jacs: db.jacs
  });
});

app.post('/api/verify-pin', (req, res) => {
  const { pin } = req.body;
  if (pin === COORDINATOR_PIN) {
    res.json({ success: true, role: 'coordinator' });
  } else {
    res.status(401).json({ success: false, message: 'PIN incorrecto' });
  }
});

// WEBSOCKET REAL-TIME EVENTS
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id} (Total: ${io.engine.clientsCount})`);

  // Send current full state immediately upon connection
  socket.emit('init:data', {
    matches: db.matches,
    medals: db.medals,
    registrations: db.registrations,
    athletes: db.athletes,
    jacs: db.jacs
  });

  // Create match
  socket.on('match:create', (newMatch, ack) => {
    if (!newMatch || !newMatch.id) return;
    const exists = db.matches.some(m => m.id === newMatch.id);
    if (!exists) {
      db.matches.push(newMatch);
      saveDatabase();
      io.emit('match:created', newMatch);
      console.log(`⚡ [Realtime] Nuevo partido programado: ${newMatch.sportId} (${newMatch.teamA?.name} vs ${newMatch.teamB?.name})`);
    }
    if (typeof ack === 'function') ack({ success: true });
  });

  // Update match schedule / status / details
  socket.on('match:update', (updatedMatch, ack) => {
    if (!updatedMatch || !updatedMatch.id) return;
    const idx = db.matches.findIndex(m => m.id === updatedMatch.id);
    if (idx !== -1) {
      db.matches[idx] = { ...db.matches[idx], ...updatedMatch };
      saveDatabase();
      io.emit('match:updated', db.matches[idx]);
      console.log(`⚡ [Realtime] Partido actualizado: ${updatedMatch.id} (${updatedMatch.status})`);
    }
    if (typeof ack === 'function') ack({ success: true });
  });

  // Score match
  socket.on('match:score', ({ matchId, scoreA, scoreB, status, winnerJacId }, ack) => {
    const idx = db.matches.findIndex(m => m.id === matchId);
    if (idx !== -1) {
      db.matches[idx] = {
        ...db.matches[idx],
        status,
        winnerJacId: winnerJacId || undefined,
        teamA: { ...db.matches[idx].teamA, score: scoreA },
        teamB: { ...db.matches[idx].teamB, score: scoreB }
      };
      saveDatabase();
      io.emit('match:updated', db.matches[idx]);
      console.log(`🏆 [Realtime] Marcador registrado en ${matchId}: ${scoreA} - ${scoreB} (${status})`);
    }
    if (typeof ack === 'function') ack({ success: true });
  });

  // Delete match
  socket.on('match:delete', (matchId, ack) => {
    db.matches = db.matches.filter(m => m.id !== matchId);
    saveDatabase();
    io.emit('match:deleted', matchId);
    console.log(`🗑️ [Realtime] Partido eliminado: ${matchId}`);
    if (typeof ack === 'function') ack({ success: true });
  });

  // Update medals
  socket.on('medal:update', ({ jacId, type, delta }, ack) => {
    if (!db.medals[jacId]) {
      db.medals[jacId] = { gold: 0, silver: 0, bronze: 0 };
    }
    const current = db.medals[jacId][type] || 0;
    const nextVal = Math.max(0, current + delta);
    db.medals[jacId][type] = nextVal;
    saveDatabase();
    io.emit('medal:updated', { jacId, medals: db.medals[jacId] });
    console.log(`🥇 [Realtime] Medallería actualizada para ${jacId}: ${type} = ${nextVal}`);
    if (typeof ack === 'function') ack({ success: true });
  });

  // Reset database (requires PIN)
  socket.on('db:reset', ({ pin }, ack) => {
    if (pin === COORDINATOR_PIN && fs.existsSync(BASELINE_FILE)) {
      const raw = fs.readFileSync(BASELINE_FILE, 'utf8');
      db = JSON.parse(raw);
      saveDatabase();
      io.emit('init:data', {
        matches: db.matches,
        medals: db.medals,
        registrations: db.registrations,
        athletes: db.athletes,
        jacs: db.jacs
      });
      console.log('🔄 [Realtime] Base de datos reiniciada a valores oficiales por el coordinador.');
      if (typeof ack === 'function') ack({ success: true });
    } else {
      if (typeof ack === 'function') ack({ success: false, message: 'PIN no autorizado' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Cliente desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 Servidor en Tiempo Real - Juegos Asocomunales 2026`);
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🔐 PIN Coordinador por defecto: ${COORDINATOR_PIN}`);
  console.log(`=======================================================`);
});
