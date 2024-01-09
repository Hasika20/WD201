const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
app.use(bodyParser.json());

app.set("view engine ", "ejs");
app.get("/", async (request, response) => {
  try {
    const allTodos = await Todo.getTodos();

    const overdueTodos = allTodos.filter(todo => todo.isOverdue());
    const dueTodayTodos = allTodos.filter(todo => todo.isDueToday());
    const dueLaterTodos = allTodos.filter(todo => todo.isDueLater());

    if (request.accepts("html")) {
      response.render('index.ejs', {
        allTodos,
        overdueTodos,
        dueTodayTodos,
        dueLaterTodos
      });
    } else {
      response.json({
        allTodos,
        overdueTodos,
        dueTodayTodos,
        dueLaterTodos
      });
    }
  } catch (error) {
    console.error(error);
    response.status(404).json({ error: "rendering Error" });
  }
});

app.use(express.static(path.join(__dirname, 'public')));


app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  // First, we have to query our PostgerSQL database using Sequelize to get list of all Todos.
  // Then, we have to respond with all Todos, like:
  // response.send(todos)
  try {
    const todos = await Todo.findAll();
    return response.json(todos)
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

app.post("/todos", async function (request, response) {
  try {
    const todo = await Todo.addTodo(request.body);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id/markAsCompleted", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  // First, we have to query our database to delete a Todo by ID.
  // Then, we have to respond back with true/false based on whether the Todo was deleted or not.
  // response.send(true)

  const todo = await Todo.findByPk(request.params.id);
  try {
    if (todo) {
      await todo.destroy();
      return response.json(true)
    }
    else {

      throw new Error('The provided id does not exist in our database')

    }

  } catch (error) {
    console.log(error);
    return response.json(false);

  }
});

module.exports = app;