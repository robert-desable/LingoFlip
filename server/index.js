const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dev
    methods: ['GET', 'POST']
  }
});

// Store rooms in memory (use Redis for production)
const rooms = new Map();

// Generate a random 4-digit numeric code
const generateRoomCode = () => Math.floor(1000 + Math.random() * 9000).toString();

io.on('connection', (socket) => {
  console.log(`[+] User connected: ${socket.id}`);

  // 1. Teacher creates a lobby
  socket.on('create-room', ({ teacherName, language = 'hi' }, callback) => {
    const roomCode = generateRoomCode();
    
    rooms.set(roomCode, {
      teacherId: socket.id,
      teacherName,
      language,
      students: [],
      transcriptHistory: [] // To store the context of what has been spoken
    });

    socket.join(roomCode);
    console.log(`[Room] ${roomCode} created by Teacher ${teacherName}`);
    
    if (callback) callback({ success: true, roomCode });
  });

  // 2. Student joins a lobby
  socket.on('join-room', ({ roomCode, studentName, motherTongue }, callback) => {
    if (!rooms.has(roomCode)) {
      if (callback) callback({ success: false, message: 'Room not found' });
      return;
    }

    const room = rooms.get(roomCode);
    
    const newStudent = {
      id: socket.id,
      name: studentName,
      motherTongue
    };
    
    room.students.push(newStudent);
    socket.join(roomCode);
    
    console.log(`[Room] Student ${studentName} joined ${roomCode}`);

    // Notify the teacher that a new student has joined
    io.to(room.teacherId).emit('student-joined', newStudent);

    if (callback) {
      callback({ 
        success: true, 
        roomDetails: { teacherName: room.teacherName, students: room.students } 
      });
    }
  });

  // 3. Handle live transcript broadcast (STT output from teacher)
  socket.on('send-transcript', ({ roomCode, text, originalLang }) => {
    if (!rooms.has(roomCode)) return;
    
    const room = rooms.get(roomCode);
    const timestamp = Date.now();
    
    const transcriptEntry = {
      id: `${timestamp}-${socket.id}`,
      text,
      originalLang,
      timestamp
    };
    
    room.transcriptHistory.push(transcriptEntry);

    // Keep history reasonably sized
    if (room.transcriptHistory.length > 50) {
      room.transcriptHistory.shift();
    }

    // Broadcast to all students in the room
    socket.to(roomCode).emit('receive-transcript', transcriptEntry);
  });

  // 4. The "Interrupt / Doubt" Signal System
  socket.on('raise-doubt', ({ roomCode }) => {
    if (!rooms.has(roomCode)) return;
    
    const room = rooms.get(roomCode);
    const student = room.students.find(s => s.id === socket.id);
    
    if (!student) return;

    // Get the last few transcripts for context (e.g., last 3 phrases)
    const recentContext = room.transcriptHistory.slice(-3);

    console.log(`[Interrupt] Doubt raised by ${student.name} in room ${roomCode}`);

    // Send the interrupt signal to the teacher along with the context
    io.to(room.teacherId).emit('student-doubt', {
      student,
      context: recentContext,
      timestamp: Date.now()
    });
  });

  // 5. Handle disconnections
  socket.on('disconnect', () => {
    console.log(`[-] User disconnected: ${socket.id}`);
    
    rooms.forEach((room, roomCode) => {
      if (room.teacherId === socket.id) {
        // Teacher disconnected
        io.to(roomCode).emit('teacher-disconnected');
        rooms.delete(roomCode);
        console.log(`[Room] ${roomCode} deleted due to teacher disconnect.`);
      } else {
        // Check if a student disconnected
        const studentIndex = room.students.findIndex(s => s.id === socket.id);
        if (studentIndex !== -1) {
          const student = room.students[studentIndex];
          room.students.splice(studentIndex, 1);
          io.to(room.teacherId).emit('student-left', student);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
