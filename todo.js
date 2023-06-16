const express = require('express');
const session = require('express-session');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const fs = require('fs');
const taskData = JSON.parse(fs.readFileSync('taskdata.json', 'utf-8'));
const user1 = { email: 'john@zli.ch', password: 'johnspassword'};
const user2 = { email: 'marco@zli.ch', password: 'marcospassword'};

app.use(bodyParser.json());
app.use(express.urlencoded({extended: true}));

app.use(session({
    secret: 'supersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {}
}));

const checkAuth = (request, response, next) => {
    if (request.session.email) {
        next();
    } else {
        response.status(403).json({ error: 'Not authenticated'});
    }
};

app.post('/login', (request, response) => {
    const { email, password} = request.body;
    if (( email ?.toLowerCase() === user1.email && password === user1.password) ||
        ( email ?.toLowerCase() === user2.email && password === user2.password)) {
        request.session.email = email;
        return response.status(200).json({ email: request.session.email });
    }

    return response.status(401).json({ error: 'Invalid credentials'});
});

app.get('/verify', checkAuth, (request, response) => {
    if (request.session.email) {
        response.status(200).json({ email: request.session.email });
    } else {
        response.status(401).json({ error: 'Not logged in' });
    }
});

app.delete('/logout', checkAuth, (request, response) => {
    request.session.destroy((error) => {
        if (error) {
            console.error('Error destroying session: ', error);
            return response.status(500).json({ error: 'Internal server error' });
        }
        response.clearCookie('connect.sid');
        response.status(204).end();
    });
});

app.get('/tasks', checkAuth, (request, response) => {
    const task_id = request.query.id;
    if (task_id) {
        const task = taskData.tasks.find((task) => String(task.id) === task_id);
        if (task) {
            response.status(200).send(task);
        } else {
            response.status(404).send('Task not found');
        }
    } else {
        response.status(200).send(taskData);
    }
});

app.post('/tasks', checkAuth, (request, response) => {
    const newTask = request.body;
    const maxId = Math.max(...taskData.tasks.map(task => task.id));
    newTask.id = maxId + 1;
    taskData.tasks.push(newTask);
    response.status(201).send(`New Task created: ${JSON.stringify(newTask)}`);
});

app.put('/tasks/:id', checkAuth, (request, response) => {
    const task_id = request.params.id;
    const updatedTask = request.body;
    const taskIndex = taskData.tasks.findIndex(task => String(task.id) === task_id);
    if (taskIndex !== -1) {
        taskData.tasks[taskIndex] = { ...taskData.tasks[taskIndex], ...updatedTask };
        response.status(200).send(`Updated Task: ${JSON.stringify(taskData.tasks[taskIndex])}`);
    } else {
        response.status(404).send('Task not found');
    }
});

app.delete('/tasks/:id', checkAuth, (request, response) => {
    const task_id = parseInt(request.params.id);
    const taskIndex = taskData.tasks.findIndex((task) => task.id === task_id);
    if (taskIndex !== -1) {
        const deletedTask = taskData.tasks.splice(taskIndex, 1);
        response.status(200).send(`Deleted Task: ${JSON.stringify(deletedTask)}`);
    } else {
        response.status(404).send('Task not found');
    }
});

app.listen(port, () => {
    console.log(`Task App listening on port ${port}`);
});