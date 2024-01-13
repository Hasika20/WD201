  /* eslint-disable no-undef */
  const flash = require("connect-flash");
  const express = require("express");
  var csrf = require("tiny-csrf");
  const app = express();
  const { Todo ,User} = require("./models");
  const bodyParser = require("body-parser");
  var cookieParser = require("cookie-parser");
  app.use(bodyParser.json());
  const path = require("path")
  const passport = require('passport') 
  const connectEnsureLogin= require('connect-ensure-login');
  const session = require('express-session');
  const LocalStartegy=require('passport-local');
  const bcrypt = require('bcrypt');
  const { error } = require("console");
  const saltRounds=10;
  app.use(express.urlencoded({ extended: false}));
  app.use(cookieParser("shh!some secret string"));
  app.use(csrf("this_should_be_32_character_long",["POST","PUT","DELETE"]));

  app.set("views", path.join(__dirname, "views"));
  app.set("view engine ","ejs");
  app.use(flash());
  app.use(express.static(path.join(__dirname,'public')));
  app.use(session({
    secret:"my-super-secret-key-21728172615261653",
    cookie:{
      maxAge:24*60*60*1000
    }
  }))
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(path.join(__dirname,'public')));
  app.use(function(request, response, next) {
    response.locals.messages = request.flash();
    next();
  });
  passport.use(new LocalStartegy({
    usernameField: 'email',
    passwordField: 'password'
  }, (username, password, done) => {
    User.findOne({ where: { email: username } })
      .then(async function (user) {
        if (!user) { // Check if user is null
          return done(null, false, { message: "Invalid email or password" });
        }
  
        const result = await bcrypt.compare(password, user.password);
        if (result) {
          return done(null, user);
        } else {
          return done(null, false, { message: "Invalid password" });
        }
      })
      .catch((err) => {
        return done(err);
      });
  }));
  
  passport.serializeUser((user,done)=>{
    console.log("serializing user in session",user.id)
    done(null,user.id)
  });
  passport.deserializeUser((id,done)=>{
    User.findByPk(id)
        .then(user=>{
          done(null,user)
        })
        .catch(error => {
          done(error,null)
        })
  }) ; 
  app.get("/", async (request, response) => {
    if (request.user) {
      return response.redirect("/todos");
    }
    
    response.render("index.ejs", {
      title: "Todo application",
      csrfToken: request.csrfToken(),
    });
  });
  


  /*app.get("/", function (request, response) {
    console.log("Todo list ",request.body);
  });*/
  app.get("/signup",(request,response)=>{
    if (request.user) {
      return response.redirect("/todos");
    }
    response.render("signup.ejs",{title:"Signup",csrfToken: request.csrfToken() })
  })

  app.post("/users",async(request,response)=>{
  const { firstName, lastName, email, password } = request.body;

  if (!firstName || !email) {
    request.flash("error", "First name and email are required");
    return response.redirect("/signup");
  }
    if (
      request.body.firstName.length != 0 &&
      request.body.email.length != 0 &&
      request.body.password.length == 0
    ) {
      request.flash("error", "Password must  be non-Empty");
      return response.redirect("/signup");
    }
    const hashedPwd =await bcrypt.hash(request.body.password,saltRounds)
    console.log(hashedPwd)
    try{
      const user=await User.create({
        firstName:request.body.firstName,
        lastName:request.body.lastName,
        email:request.body.email,
        password:hashedPwd
      });
      request.login(user,(err)=>{
        if(err) {
          console.log(err)
        }
        response.redirect("/todos");
      })
    }catch(error) {
      request.flash("error","Email already registered");
      response.redirect("/signup");
      console.log(error);
    }
  });

  app.get("/login",(request,response)=> {
    response.render("login.ejs",{title:"Login",csrfToken:request.csrfToken()});
    })

    app.post(
      "/session",
      passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true,
      }),
      function (request, response, next) {
        request.flash("error", request.authInfo.message);
        next();
      },
      function (request, response) {
        console.log(request.user);
        response.redirect("/todos");
      }
    );
    


  app.get("/signout",(request,response)=>{
    request.logout((err)=> {
      if (err) {return next(err);}
      response.redirect("/");
    })
  })

  app.get("/todos",connectEnsureLogin.ensureLoggedIn(), async (request,response) =>{
    const loggedInUser = request.user.id;
    const un=await User.findByPk(request.user.id);
    const username=un.firstName+" "+un.lastName;
    const overdue = await Todo.overdue(loggedInUser);
    const dueToday  = await Todo.dueToday(loggedInUser);
    const dueLater = await Todo.dueLater(loggedInUser);
    const completed = await Todo.completed(loggedInUser);

    
    if(request.accepts("html")){
      response.render("todo.ejs",{
        title:"Todo application",
        overdue,
        dueToday,
        dueLater,
        completed,
        username,
        csrfToken: request.csrfToken(),
    });
    }else{
      response.json({
        overdue,
        dueToday,
        dueLater,
        completed,
        username
      })
    }
  });

  

  app.post("/todos", connectEnsureLogin.ensureLoggedIn(),async function (request, response) {
    console.log("creating a todo",request.body);
    console.log(request.user)
    const { title, dueDate } = request.body;

  if (!title || !dueDate) {
    request.flash("error", "Title and due date are required");
    return response.redirect("/todos");
  }
  if (title.length < 5) {
    request.flash("error", "Title must be at least 5 characters long");
    return response.redirect("/todos");
  }
    try {
      await Todo.addTodo({
        title:request.body.title,
        dueDate:request.body.dueDate,
        userId:request.user.id
      }
      );
      return response.redirect("/todos")
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  });


  app.put(
    "/todos/:id",
    connectEnsureLogin.ensureLoggedIn(),
    async function (request, response) {
      try {
        const todo = await Todo.findByPk(request.params.id);
        const updatedTodo = await todo.setCompletionStatus(
          request.body.completed
        );
        return response.json(updatedTodo);
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    }
  );


  app.delete("/todos/:id",connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
    console.log("We have to delete a Todo with ID: ", request.params.id);
    try{
      await Todo.remove(request.params.id,request.user.id);
      response.json({success: true});
    }
    catch(error){
      console.log(error);
      return response.status(422).json(error);   
    }
  });
  
  module.exports = app; 