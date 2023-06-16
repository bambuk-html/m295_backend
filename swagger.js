const swaggerAutogen = require('swagger-autogen')()

const outputFile = './swagger_output.json'
const endpointsFiles = ['./TASK/m295_backend/todo.js']

swaggerAutogen(outputFile, endpointsFiles)