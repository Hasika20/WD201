/* eslint-disable */

const express = require("express");
var csrf = require("tiny-csrf");
var cookieParser = require("cookie-parser");
const app = express();
const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
const path = require("path"); // here we are using path module to get the path of the public folder
// to render files from the public folder
app.set("views", path.join(__dirname, "views")); // this is the path to the views folder. i need it
app.use(express.static(path.join(__dirname, "public"))); // here we are using path module to get the path of the public folder

// import authentication middlewares
const passport = require("passport");
const session = require("express-session");
const connectEnsureLogin = require("connect-ensure-login");
const LocalStrategy = require("passport-local").Strategy;

// password encryption
const bcrypt = require("bcrypt");

// connect flash message
const flash = require("connect-flash");
app.use(flash());

const saltRounds = 10;
app.use(bodyParser.json());

app.use(express.urlencoded({ extended: false })); //
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

// configure passport.js to use the session
app.use(
  session({
    secret: "my_super_secret_key-2345235234534534534",
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  })
);

app.use(passport.initialize());
app.use(passport.session());

// set the view engine to ejs
app.set("view engine", "ejs");

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});
/* course code 
// configure passport.js to use the local strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
  .then(async function (user) {
    const result = await bcrypt.compare(password, user.password);
    if (result) {
      return done(null, user);
    } else {
      return done(null, false, { message: "Invalid password" });
    }
  })
  .catch((error) => {
    return done(error);
  });
    }));
    
  */
// my local strategy code
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        // Find the user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
          // If no user found with the given email, return an error
          return done(null, false, { message: "Invalid email address" });
        }
        // Compare the provided password with the stored password hash
        const result = await bcrypt.compare(password, user.password);
        if (result) {
          // If the passwords match, return the user object
          return done(null, user);
        } else {
          // If the passwords don't match, return an error
          return done(null, false, { message: "Invalid password" });
        }
      } catch (error) {
        return done(error);
      }
    }
  )
);
passport.serializeUser((user, done) => {
  console.log("serializing user in session ", user.id);
  done(null, user.id);
});

// tell passport how to deserialize the user
passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      console.log("deserializing user in session ", user.id);
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

// this is root route and it is public
app.get("/", async (request, response) => {
  response.render("index", {
    title: "Todo Application",
    csrfToken: request.csrfToken(),
  });
});

app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const userId = request.user.id;
    const overdue = await Todo.overdue(userId);
    const dueToday = await Todo.dueToday(userId);
    const dueLater = await Todo.dueLater(userId);
    const completedItem = await Todo.completedItem(userId);
    // give the details of the user to the view
    const user = request.user;

    if (request.accepts("html")) {
      response.render("todos", {
        title: "Todo Application",
        overdue,
        dueToday,
        dueLater,
        completedItem,
        csrfToken: request.csrfToken(),
        user,
      });
    } else {
      response.json({
        overdue,
        dueToday,
        dueLater,
        completedItem,
        user,
      });
    }
  }
);

app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  // FILL IN YOUR CODE HERE
  try {
    const todos = await Todo.findAll();
    return response.json(todos);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
  // First, we have to query our PostgerSQL database using Sequelize to get list of all Todos.
  // Then, we have to respond with all Todos, like:
  // response.send(todos)
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

// render the login page
app.get("/signup", function (request, response) {
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken(),
  });
});

// render the users page
app.get("/users", function (request, response) {
  response.render("signup", { title: "login", csrfToken: request.csrfToken() });
});

// creating users route to render the signup.ejs file
app.post("/users", async function (request, response) {
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  const { firstName, email, password } = request.body;
  if (!firstName || !email || !password) {
    request.flash("error", "Please fill all the fields");
    return response.redirect("/users");
  }
  // check the database if the user already exists
  const user = await User.findOne({ where: { email } });
  if (user) {
    request.flash("error", "User already exists");
    return response.redirect("/users");
  }
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    // here we should initialize the session
    request.login(user, (error) => {
      if (error) {
        console.log(error);
        return response.status(422).json(error);
      }
      return response.redirect("/todos");
    });
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

// render the login page
app.get("/login", function (request, response) {
  response.render("login", { title: "Login", csrfToken: request.csrfToken() }); // here the title is located in the login.ejs file
});

// creating session route to render the login.ejs file
app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    response.redirect("/todos");
  }
);

// creating logout route to render the login.ejs file
app.get("/signout", (request, response, next) => {
  request.logout((error) => {
    //logout is a method provided by passport
    if (error) {
      return next(error);
    }
    return response.redirect("/"); // redirect to the landing page
  });
});

// this method is used to create a new todo
app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Processing new Todo ...", request.user);
    const { title, dueDateTime } = request.body;
    console.log("dueDateTime", dueDateTime)
    if (!title || title.length < 5) {
      request.flash("error", "Todo title must be at least 5 characters");
      return response.redirect("/todos");
    } else if (!dueDateTime) {
      request.flash("error", "Please enter due date");
      return response.redirect("/todos");
    }
    try {
      await Todo.addTodo({
        title: request.body.title,
        dueDateTime: request.body.dueDateTime,
        userId: request.user.id,
      });
      return response.redirect("/todos");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.put("/todos/:id", async function (request, response) {
  // const todo = await Todo.findByPk(request.params.id);
  const todo = await Todo.findByPk(request.params.id);
  const deletedUserId = todo.userId; // this is the user id of the todo that we want to delete
  try {
    if (request.user.id !== deletedUserId) {
      return response.status(401).send({ message: "Unauthorized" });
    }

    // get the value of completed in /todos/:id/completed
    const completed = request.body.completed;
    const updatedTodo = await todo.setCompletionStatus(completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  const userId = request.user.id; // this is the user id of the logged in user

  const todo = await Todo.findByPk(request.params.id);
  const deletedUserId = todo.userId; // this is the user id of the todo that we want to delete
  console.log("#######delete", deletedUserId);
  console.log("#######logged user", request.user.id);
  console.log("#######todo id", request.params.id);
  try {
    if (request.user.id !== deletedUserId) {
      return response.status(401).send({ message: "Unauthorized" });
    }
    // FILL IN YOUR CODE HERE
    await Todo.remove(request.params.id, userId);
    return response.json({ success: true });
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

module.exports = app;
