const express = require('express');
const session = require('express-session');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const fs = require('fs');
const taskData = JSON.parse(fs.readFileSync('taskdata.json', 'utf-8'));

app.use(bodyParser.json());
app.use(express.urlencoded({extended: true}));

app.use(session({
    secret: 'supersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {}
}));

app.post('/login', (request, response) => {
    const { email, password} = request.body;
    if ( password === 'm295') {
        request.session.email = email;
        return response.status(200).json({ email: request.session.email });
    }

    return response.status(401).json({ error: 'Invalid credentials'});
});

app.get('/tasks', (request, response) => {
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

app.post('/tasks', (request, response) => {
    const newTask = request.body;
    const maxId = Math.max(...taskData.tasks.map(task => task.id));
    newTask.id = maxId + 1;
    taskData.tasks.push(newTask);
    response.status(201).send(`New Task created: ${JSON.stringify(newTask)}`);
});

app.put('/tasks/:id', (request, response) => {
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

app.delete('/tasks/:id', (request, response) => {
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