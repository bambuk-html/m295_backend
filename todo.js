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

app.listen(port, () => {
    console.log(`Task App listening on port ${port}`);
});