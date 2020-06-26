/*
All Imports
*/
const express= require('express');
const path= require('path');
const bodyParser = require('body-parser');

const app= express();

/*
Setting View Engine
*/
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.static(path.join(__dirname, 'public')));

const userRoutes = require('./routes/userRoutes');
const webRoutes= require('./routes/webRoutes');

app.use(userRoutes);
app.use(webRoutes);

app.use((req,res,next) => {
    res.status(404).render("error-404");
});

app.listen(3000, ()=> {
    console.log('Connected!');
});