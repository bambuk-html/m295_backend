const express = require('express')
const session = require('express-session')
const app = express()
const port = 3000
const bodyParser = require('body-parser')
const fs = require('fs')
const taskData = JSON.parse(fs.readFileSync('taskdata.json', 'utf-8'))
const user1 = { email: 'john@zli.ch', password: 'johnspassword' }
const user2 = { email: 'marco@zli.ch', password: 'marcospassword' }
const swaggerFile = require('./swagger_output.json')
const swaggerUi = require('swagger-ui-express')

app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true }))

app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))

app.use(session({
  secret: 'supersecret',
  resave: false,
  saveUninitialized: true,
  cookie: {}
}))

const checkAuth = (request, response, next) => {
  if (request.session.email) {
    next()
  } else {
    response.status(403).json({ error: 'Not authenticated' })
  }
}

app.post('/login', (request, response) => {
  const { email, password } = request.body
  if ((email?.toLowerCase() === user1.email && password === user1.password) ||
        (email?.toLowerCase() === user2.email && password === user2.password)) {
    request.session.email = email
    return response.status(200).json({ email: request.session.email })
  }

  return response.status(401).json({ error: 'Invalid credentials' })
})

app.get('/verify', checkAuth, (request, response) => {
  if (request.session.email) {
    response.status(200).json({ email: request.session.email })
  } else {
    response.status(401).json({ error: 'Not logged in' })
  }
})

app.delete('/logout', checkAuth, (request, response) => {
  request.session.destroy((error) => {
    if (error) {
      console.error('Error destroying session: ', error)
      return response.status(500).json({ error: 'Internal server error' })
    }
    response.clearCookie('connect.sid')
    response.status(204).end()
  })
})

app.get('/tasks', checkAuth, (request, response) => {
  const taskId = request.query.id
  if (taskId) {
    const task = taskData.tasks.find((task) => String(task.id) === taskId)
    if (task) {
      response.status(200).send(task)
    } else {
      response.status(404).send('Task not found')
    }
  } else {
    response.status(200).send(taskData)
  }
})

app.post('/tasks', checkAuth, (request, response) => {
  const newTask = request.body
  if (!newTask.title || newTask.title.trim() === '') {
    response.status(406).json({ error: 'Cant Post nameless Task' })
  }

  const maxId = Math.max(...taskData.tasks.map(task => task.id))
  newTask.id = maxId + 1
  taskData.tasks.push(newTask)
  response.status(201).send(`New Task created: ${JSON.stringify(newTask)}`)
})

app.put('/tasks/:id', checkAuth, (request, response) => {
  const taskId = request.params.id
  const updatedTask = request.body
  const taskIndex = taskData.tasks.findIndex(task => String(task.id) === taskId)
  if (taskIndex !== -1) {
    taskData.tasks[taskIndex] = { ...taskData.tasks[taskIndex], ...updatedTask }
    response.status(200).send(`Updated Task: ${JSON.stringify(taskData.tasks[taskIndex])}`)
  } else {
    response.status(404).send('Task not found')
  }
})

app.delete('/tasks/:id', checkAuth, (request, response) => {
  const taskId = parseInt(request.params.id)
  const taskIndex = taskData.tasks.findIndex((task) => task.id === taskId)
  if (taskIndex !== -1) {
    const deletedTask = taskData.tasks.splice(taskIndex, 1)
    response.status(200).send(`Deleted Task: ${JSON.stringify(deletedTask)}`)
  } else {
    response.status(404).send('Task not found')
  }
})

const errorHandler = (request, response, error, next) => {
  console.error('An error occurred:', error)
  response.status(500).json({ error: 'Internal server error' })
}
app.use(errorHandler)

const handleNotFound = (request, response, next) => {
  response.status(404).json({ error: 'Not Found' })
}
app.use(handleNotFound)

app.listen(port, () => {
  console.log(`Task App listening on port ${port}`)
})
