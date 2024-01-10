const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
app.use(bodyParser.json());

app.set("view engine", "ejs");

// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));
app.get("/", async function (request, response) {
  try {
    const todos = await Todo.findAll();
    console.log(todos);
    return response.render("index.ejs", { todos });
  } catch (error) {
    console.error(error);
    return response.status(422).json(error);
  }
});
app.get("/todos", async function (request, response) {
  try {
    const allTodos = await Todo.findAll();
    response.json(allTodos); // Use response.json() to send JSON data
  } catch (error) {
    console.error(error);
    return response.status(422).json(error);
  }
});

app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  // FILL IN YOUR CODE HERE

  // First, we have to query our PostgerSQL database using Sequelize to get list of all Todos.
  // Then, we have to respond with all Todos, like:
  // response.send(todos)
  try {
    const todos = await Todo.findAll();
    return response.json(todos);
  } catch (error) {
    console.error(error);
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
  // FILL IN YOUR CODE HERE

  // First, we have to query our database to delete a Todo by ID.
  // Then, we have to respond back with true/false based on whether the Todo was deleted or not.
  // response.send(true)
  try {
    const deleted = await Todo.destroy({
      where: {
        id: request.params.id,
      },
    });

    const isDeleted = deleted > 0;
    if (isDeleted) {
      response.send(true);
    } else {
      response.send(false);
    }
  } catch (error) {
    console.error(error);
    return response.status(422).json(error);
  }
});

module.exports = app;
