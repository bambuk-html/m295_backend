const express = require('express');
const session = require('express-session');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const fs = require('fs');

app.use(bodyParser.json());
app.use(express.urlencoded({extended: true}));

app.use()

console.log('tihan');