/* eslint-disable no-undef */
const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;

function extractCsrfToken(res) {
  const $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

//Test suite for L9
describe("Todo test suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("Not creating a todo item with empty date", async () => {
    const res = await agent.post("/todos").send({
      title: "Empty date todo",
      dueDate: "",
      completed: false,
    });
    expect(res.status).toBe(400);
  });

  test("Create a sample due today item", async () => {
    const res = await agent.post("/todos").send({
      title: "Due-Today Todo",
      dueDate: new Date().toISOString().split("T")[0],
      completed: false,
    });

    expect(res.status).toBe(500);
  });

  test("Creating a sample due later item", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const res = await agent.post("/todos").send({
      title: "Go Goa",
      dueDate: tomorrow.toISOString().split("T")[0],
      completed: false,
    });
    expect(res.status).toBe(302);
  });

  test("Creating a sample overdue item", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const res = await agent.post("/todos").send({
      title: "Submit assignment",
      dueDate: yesterday.toISOString().split("T")[0],
      completed: false,
    });
    expect(res.status).toBe(302);
  });

  test("Marking a sample overdue item as completed", async () => {
    // Create an overdue todo
    const overdueRes = await agent.post("/todos").send({
      title: "Overdue Todo",
      dueDate: "2021-01-01",
      completed: false,
    });

    // Extract the ID of the created todo
    const overdueTodoId = Number(overdueRes.header.location.split("/")[2]);

    const markCompletedResponse = await agent.put(`/todos/${overdueTodoId}`).send({
      _csrf: extractCsrfToken(overdueRes),
      completed: true,
    });

    expect(markCompletedResponse.status).toBe(200);
    expect(markCompletedResponse.body.completed).toBe(true);
  });

  test("Toggle a completed item to incomplete when clicked on it", async () => {
    const completedTodo = await agent.post("/todos").send({
      title: "This is completed Todo",
      dueDate: new Date().toISOString().split("T")[0],
      completed: true,
    });

    const completedTodoId = Number(completedTodo.header.location.split("/")[2]);

    const toggleResponse = await agent.put(`/todos/${completedTodoId}`).send({
      _csrf: extractCsrfToken(completedTodo),
      completed: false,
    });

    expect(toggleResponse.status).toBe(200);
    expect(toggleResponse.body.completed).toBe(false);
  });

  test("Delete a todo item", async () => {
    const createTodo = await agent.post("/todos").send({
      title: "Todo to Delete",
      dueDate: new Date().toISOString().split("T")[0],
      completed: false,
    });

    const Id = Number(createTodo.header.location.split("/")[2]);

    const dltResponse = await agent.delete(`/todos/${Id}`).send();

    expect(dltResponse.status).toBe(302);
  });
});
