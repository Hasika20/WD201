const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const path = require("path");

const passport = require("passport");
const connnectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");

const saltRounds = 10;

app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(flash());

const { Todo, User } = require("./models");

app.use(
  session({
    secret: "my-super-secret-key-23487623476321414726",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch(() => {
          return done(null, false, {
            message: "Account doesn't exist for this mail",
          });
        });
    },
  ),
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session: ", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.set("view engine", "ejs");

app.get("/", async (request, response) => {
  // Check if the user is logged in
  if (request.isAuthenticated()) {
    // Redirect to "/todos" if the user is logged in
    return response.redirect("/todos");
  }
  // for non-logged-in users
  response.render("index", {
    title: "Todo Application",
    csrfToken: request.csrfToken(),
  });
});

app.get(
  "/todos",
  connnectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    const loggedInUserfName = request.user.firstName;
    const loggedInUserlName = request.user.lastName;

    const allTodos = await Todo.getTodos(loggedInUser);
    const overdue = await Todo.overdue(loggedInUser);
    const dueToday = await Todo.dueToday(loggedInUser);
    const dueLater = await Todo.dueLater(loggedInUser);
    const completedItems = await Todo.completedItems(loggedInUser);

    if (request.accepts("html")) {
      response.render("todos", {
        title: "Todo Application",
        allTodos,
        overdue,
        dueLater,
        dueToday,
        completedItems,
        csrfToken: request.csrfToken(),
        userfName: loggedInUserfName,
        userlName: loggedInUserlName,
      });
    } else {
      response.json({ overdue, dueLater, dueToday, completedItems });
    }
  },
);

app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken(),
  });
});

app.post("/users", async (request, response) => {
  if (request.body.email.length == 0) {
    request.flash("error", "Email can not be empty!");
    return response.redirect("/signup");
  }

  if (request.body.firstName.length == 0) {
    request.flash("error", "First name cannot be empty!");
    return response.redirect("/signup");
  }

  if (request.body.lastName.length == 0) {
    request.flash("error", "Last name cannot be empty!");
    return response.redirect("/signup");
  }

  if (request.body.password.length < 8) {
    request.flash("error", "Password must be at least 8 characters");
    return response.redirect("/signup");
  }

  //hashing the password
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  //have to create a user
  console.log(request.user);
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/todos");
    });
  } catch (error) {
    console.log(error);
  }
});

app.get("/login", (request, reponse) => {
  reponse.render("login", { title: "Login", csrfToken: request.csrfToken() });
});

app.get("/resetpassword", (request, reponse) => {
  reponse.render("resetpassword", {
    title: "Reset Password",
    csrfToken: request.csrfToken(),
  });
});

// Route for updating the password
app.post("/setpassword", async (request, response) => {
  const userEmail = request.body.email;
  const newPassword = request.body.password;

  try {
    // Find the user by email
    const user = await User.findOne({ where: { email: userEmail } });

    if (!user) {
      request.flash("error", "User with that email does not exist.");
      return response.redirect("/resetpassword");
    }

    // Hash the new password
    const hashedPwd = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password in the database
    await user.update({ password: hashedPwd });

    // Redirect to a success page or login page
    return response.redirect("/login");
  } catch (error) {
    console.log(error);
    request.flash("error", "Error updating the password.");
    return response.redirect("/resetpassword");
  }
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    // Authentication was successful, redirect to /todos
    console.log(request.user);
    response.redirect("/todos");
  },
);

app.get("/signout", (request, response, next) => {
  //signout
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.get("/todos", async (_request, response) => {
  console.log("We have to fetch all the todos");
  try {
    const all_todos = await Todo.findAll();
    return response.send(all_todos);
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

app.post(
  "/todos",
  connnectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.body.title.length == 0) {
      request.flash("error", "Title cannot be empty!");
      return response.redirect("/todos");
    }

    if (request.body.dueDate.length == 0) {
      request.flash("error", "Due date cannot be empty!");
      return response.redirect("/todos");
    }

    console.log("Creating new todo:", request.body);
    try {
      await Todo.addTodo({
        title: request.body.title,
        dueDate: request.body.dueDate,
        userId: request.user.id,
      });
      return response.redirect("/todos");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  },
);

app.put(
  "/todos/:id",
  connnectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("We have to update a todo with ID:", request.params.id);
    const todo = await Todo.findByPk(request.params.id);
    try {
      const updatedtodo = await todo.setCompletionStatus(
        request.body.completed,
      );
      return response.json(updatedtodo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  },
);

app.put("/todos/:id/markAsCompleted", async (request, response) => {
  console.log("We have to update a todo with ID:", request.params.id);
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedtodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedtodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete(
  "/todos/:id",
  connnectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    // console.log("Delete a todo by ID: ", request.params.id)
    const loggedInUser = request.user.id;
    console.log("We have to delete a todo with ID: ", request.params.id);
    try {
      const status = await Todo.remove(request.params.id, loggedInUser);
      return response.json(status ? true : false);
    } catch (err) {
      return response.status(422).json(err);
    }
  },
);

module.exports = app;
