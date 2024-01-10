const request = require("supertest");
const db = require("../models/index");
const app = require("../app");
const { Todo } = require("../models");

let server, agent;
describe("Todo Application", function () {
beforeAll(async () => {
   await db.sequelize.sync({ force: true });
   server = app.listen(3000, () => {});
   agent = request.agent(server);
   await Todo.destroy({ where: {} });
});

afterAll(async () => {
   await db.sequelize.close();
   server.close();
});

test("responds with json at /todos", async () => {
   const response = await agent.post('/todos').send({
      title: 'Buy milk',
      dueDate: new Date().toISOString(),
      completed: false
   });

   expect(response.statusCode).toBe(200);
   expect(response.header["content-type"]).toBe("application/json; charset=utf-8");

   const parsedResponse = JSON.parse(response.text);
   expect(parsedResponse.id).toBeDefined();
});

test("Mark a todo as complete", async () => {
   const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
   });

   const parsedResponse = JSON.parse(response.text);
   const todoID = parsedResponse.id;

   expect(parsedResponse.completed).toBe(false);

   const markAsCompleted = await agent.put(`/todos/${todoID}/markAsCompleted`).send();
   const parsedUpdateResponse = JSON.parse(markAsCompleted.text);
   expect(parsedUpdateResponse.completed).toBe(true);
});
test("Fetches all todos in the database using /todos endpoint", async () => {
   // Assuming you have todos in the database, you can add some todos using your app or Sequelize directly.

   const response = await agent.get('/todos');

   expect(response.statusCode).toBe(200);
   expect(response.header["content-type"]).toBe("application/json; charset=utf-8");

   const parsedResponse = JSON.parse(response.text);
   expect(Array.isArray(parsedResponse)).toBe(true);
   // You can add more specific assertions based on your actual data model.
});
test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
   // Create a new todo to delete
   const newTodo = await agent.post("/todos").send({
     title: "Delete me",
     dueDate: new Date().toISOString(),
     completed: false,
   });
   const parsedTodo = JSON.parse(newTodo.text);
   const todoIDToDelete = parsedTodo.id;

   // Attempt to delete the created todo
   const deleteResponse = await agent.delete(`/todos/${todoIDToDelete}`).send();

   // Check if deletion was successful
   expect(deleteResponse.statusCode).toBe(200);
   expect(deleteResponse.header["content-type"]).toBe("application/json; charset=utf-8");
   const parsedDeleteResponse = JSON.parse(deleteResponse.text);
   expect(parsedDeleteResponse).toBe(true);
  });
});
