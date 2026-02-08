require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log("Press Ctrl+C to stop.");
});
