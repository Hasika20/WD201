const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const { Todo } = require("./models")
const path = require("path");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false}));

app.set("view engine", "ejs");

app.get("/", async (request, response) => {
  try {
    const allTodos = await Todo.getTodos();
    
    const overdueTodos = allTodos.filter(todo => todo.isOverdue());
    const dueTodayTodos = allTodos.filter(todo => todo.isDueToday());
    const dueLaterTodos = allTodos.filter(todo => todo.isDueLater());
    
    if (request.accepts("html")) {
      response.render('index', {
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
    console.error("Error fetching todos:", error);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get("/todos", async (request, response) => {
  console.log("Todo list")
  try {
    const todos = await Todo.findAll();
    response.json(todos);
  } catch (error) {
    console.error("Error fetching todos:", error);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/todos", async (request, response) => {
  console.log("Creating a todo", request.body);
  try {
    const todo = await Todo.addTodo({ 
      title: request.body.title, 
      dueDate: request.body.dueDate, 
    })
    return response.redirect("/");
  } catch (error) {
    console.log(error)
    return response.status(422).json(error)
  }
})

app.put("/todos/:id/markAsCompleted", async (request, response) => {
  console.log("We have to update a todo with ID:", request.params.id)
  const todo = await Todo.findByPk(request.params.id)
  try {
    const updatedTodo = await todo.markAsCompleted()
    return response.json(updatedTodo)
  } catch (error) {
    console.log(error)
    return response.status(422).json(error)
  }
})

app.delete("/todos/:id", async (request, response) => {
  console.log("Delete a todo by ID:", request.params.id)
  const todoId = request.params.id;
  const todo = await Todo.findByPk(todoId);
  try {
    if (!todo) {
      return response.status(404).send(false);
    }
    else {
      return response.send(await todo.destroy() ? true : false);
    }
  } catch (error) {
    console.error("Error deleting todo:", error);
    return response.status(500).json({ success: false, error: "Internal Server Error" });
  }
})

module.exports = app;
