const express = require("express");
const app = express();
var csrf = require("csurf");
var cookieParser = require("cookie-parser");
const { Todo,User } = require("./models");
const bodyParser = require("body-parser");
const todo = require("./models/todo");
const { where } = require("sequelize");
const path = require("path");
const { urlencoded, response } = require("express");
const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');
const session = require('express-session');
const LocalStrategy = require('passport-local');
const { error } = require("console");
const flash = require("connect-flash");
const bcrypt = require("bcrypt");
const { request } = require("http");
//const { next } = require("cheerio/lib/api/traversing");
app.use(bodyParser.json());
app.use(express.urlencoded({extended : false }));
app.use(cookieParser("i'm a bad rishi"));
app.use(csrf({cookie: true})); 
app.use(session({
  secret:"my key super secret ",
  cookie:{
    maxAge:24*60*60*1000
  }
}))

app.use(passport.initialize());
app.use(passport.session());

const saltRounds= 10;


app.set("view engine","ejs");

app.set("views", path.join(__dirname, "views"));


app.use(express.static(path.join(__dirname + "/public")))
app.use(flash());


passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},(username,password,done)=>{
  User.findOne({where:{email: username}})
  .then(async (user)=>{
    const result = await bcrypt.compare(password,user.password)
    if(result){
      return done(null,user);
    } 
    else{
      return done(null, false, { message: "Invalid password" });
    }
    
  }).catch((error)=>{
    return (error)
  })
}));

passport.serializeUser((user,done)=>{
  console.log("Serializing user in session", user.id);
  done(null,user.id)
});

passport.deserializeUser((id,done)=>{
  User.findByPk(id)
  .then(user => {
    done(null,user)
  })
  .catch(error => {
    done(error,null)
  })
})

app.use(function(request, response, next) {
  response.locals.messages = request.flash();
  next();
});


app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  try {
    const todo = await Todo.findAll();
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/", async function (request, response) {
  if(request.accepts("html")){
    response.render("index",{
      csrfToken: request.csrfToken(),
    });
  }
  else{
    response.json({
    });
  }
});
 
app.get("/todo",connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
  const loggedInUser = request.user.id;
  const odue = await Todo.odue(loggedInUser);
  const tdue = await Todo.tdue(loggedInUser);
  const ldue = await Todo.ldue(loggedInUser);
  const completedItems = await Todo.completedItems(loggedInUser);
  if(request.accepts("html")){
    response.render("todos",{
      odue,tdue,ldue,completedItems, 
      csrfToken: request.csrfToken(),
    });
  }
  else{
    response.json({
      odue,tdue,ldue,
    });
  }
});


//app.post("/todos", async (request, response) => { 

app.get("/signup",(request,response)=> {
  response.render("signup",{title:"Signup", csrfToken: request.csrfToken()})
})


app.get("/signout", (request,response,next)=>{
  request.logout((error)=>{
    if(error){ return next(error);}
    response.redirect("/");
  })
})

app.post("/todos",connectEnsureLogin.ensureLoggedIn(), async (request, response) => { 
  if (request.body.title.length == 0) {
    request.flash("error", "Title can not be empty!");
    return response.redirect("/todo");
  }
  if (request.body.title.length <= 4) {
    request.flash("error", "Title should be minimum 5 character!");
    return response.redirect("/todo");
  }
  if (request.body.dueDate.length == 0) {
    request.flash("error", "Due date can not be empty!");
    return response.redirect("/todo");
  }
  console.log("Creating a todo", request.body);
  try {
  const todo = await Todo.addTodo ({
    title: request.body.title, 
    dueDate: request.body.dueDate,
    userId: request.user.id,
  }); 
    return response.redirect("/todo");
}
  catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
}); 

app.post("/users",async (request,response)=>{
  if (request.body.firstName.length == 0) {
    request.flash("error", "First Name can not be empty!");
    return response.redirect("/signup");
  }
  if (request.body.email.length == 0) {
    request.flash("error", "Email address can not be empty!");
    return response.redirect("/signup");
  }
  if (request.body.password.length == 0) {
    request.flash("error", "Password can not be empty!");
    return response.redirect("/signup");
  }
  const hashedpwd = await bcrypt.hash(request.body.password,saltRounds);
  console.log(hashedpwd);
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedpwd
    });
    request.login(user,(error)=>{
      if(error){
        console.log(error)
      }
      response.redirect("/todo");
    })
  } catch(error){
    console.log(error);
  }
});


app.get("/login", (request,response)=>{
  response.render("login",{title:"login", csrfToken: request.csrfToken(),});
})


app.post("/session",passport.authenticate('local',{ failureRedirect:"/login",failureFlash: true,}),(request,response)=>{
  console.log(request.user);
  response.redirect("/todo");
})



app.put("/todos/:id",connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  } 
});

app.delete("/todos/:id",connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  try {
    await Todo.remove(request.params.id);
    return response.json({success:true});
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

module.exports = app;
