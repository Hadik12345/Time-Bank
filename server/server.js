// server/server.js
const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// In-memory "database" for demonstration
let tasks = [
    // ... initial tasks if you want
];
let users = {
    "john.doe@example.com": {
        full_name: "John Doe",
        email: "john.doe@example.com",
        time_credits: 120,
        city: "Mumbai",
        skills: ["React", "Gardening"],
        total_tasks_completed: 0,
        total_tasks_received: 0
    }
};


// --- API Endpoints ---

// Get all tasks
app.get('/tasks', (req, res) => {
    res.json(tasks);
});

// Create a new task
app.post('/tasks', (req, res) => {
    const newTask = { id: Date.now().toString(), ...req.body };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

// Get user data
app.get('/users/me', (req, res) => {
    // In a real app, you'd have authentication to identify the user
    res.json(users["john.doe@example.com"]);
});

// Update user data
app.put('/users/me', (req, res) => {
    // In a real app, you'd have authentication to identify the user
    const currentUser = users["john.doe@example.com"];
    users["john.doe@example.com"] = { ...currentUser, ...req.body };
    res.json(users["john.doe@example.com"]);
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});