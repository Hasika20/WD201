const express = require("express");
const app = express();
const { Todo } = require("./models");
const path = require("path");
const bodyParser = require("body-parser");
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("Shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.get("/", async function (request, response) {
  try {
    const allTodo = await Todo.getTodo();
    const overdueTodos = await Todo.overdue();
    const dueTodayTodos = await Todo.dueToday();
    const dueLaterTodos = await Todo.dueLater();
    const completed = await Todo.completedItem();

    if (request.accepts("html")) {
      response.render("index", {
        allTodo,
        overdueTodos,
        dueTodayTodos,
        dueLaterTodos,
        completed,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        allTodo,
        overdueTodos,
        dueTodayTodos,
        dueLaterTodos,
        completed,
      });
    }
  } catch (error) {
    console.log(error);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.get("/todos", async function (_request, response) {
  try {
    const allTodo = await Todo.getTodo();
    const overdueTodos = await Todo.overdue();
    const dueTodayTodos = await Todo.dueToday();
    const dueLaterTodos = await Todo.dueLater();
    const completed = await Todo.completedItem();

    response.json({
      allTodo,
      overdueTodos,
      dueTodayTodos,
      dueLaterTodos,
      completed,
    });
  } catch (error) {
    console.log(error);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    response.json(todo);
  } catch (error) {
    console.log(error);
    response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  try {
    await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
    });
    response.redirect("/");
  } catch (error) {
    console.log(error);
    response.status(422).json(error);
  }
});

app.put("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    const status = todo.completed;
    const updatedTodo = await todo.setCompletionStatus(!status);
    response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    response.status(422).json(error);
  }
});

app.delete("/todos/:id/delete", async (request, response) => {
  console.log("Delete a todo by ID:", request.params.id);

  try {
    const deletedItem = await Todo.deletetodo(request.params.id);
    response.send(deletedItem ? true : false);
  } catch (error) {
    console.error(error);
    response.status(442).json(error);
  }
});

module.exports = app;
