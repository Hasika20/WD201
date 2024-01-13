const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
const { response } = require("../app");

let server, agent;

function extractCsrfToken(res){
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Sign up", async ()=> {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName:"Test",
      lastName:"user A",
      email:"user.a@gmail.com",
      password:"12345678",
      _csrf:csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Sign out",async ()=>{
    let res = await agent.get("/todo");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/todo");
    expect(res.statusCode).toBe(302);
  });

  test("Creates a new todos", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@gmail.com", "12345678");
    let res = await agent.get("/todo");
    let csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      "_csrf": csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Mark a todo as complete", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@gmail.com", "12345678");
    let res = await agent.get("/todo");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todo")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.tdue.length;
    const latestTodo = parsedGroupedResponse.tdue[dueTodayCount - 1];

    res = await agent.get("/todo");
    csrfToken = extractCsrfToken(res);

    let markCompleteResponse = await agent.put(`/todos/${latestTodo.id}/`).send({
        _csrf: csrfToken,
        completed: true,
      });
    let parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);

  });

 

  test("Mark a todo as incomplete", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@gmail.com", "12345678");
    let res = await agent.get("/todo");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todo")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.tdue.length;
    const latestTodo = parsedGroupedResponse.tdue[dueTodayCount - 1];

    res = await agent.get("/todo");
    csrfToken = extractCsrfToken(res);

    let markinCompleteResponse = await agent.put(`/todos/${latestTodo.id}/`).send({
        _csrf: csrfToken,
        completed: false,
      });
    let parsedUpdateResponse = JSON.parse(markinCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(false);

  });


  

  test("Delete a todo", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@gmail.com", "12345678");
  let res = await agent.get("/todo"); 
  let csrfToken = extractCsrfToken(res);
  await agent.post("/todos").send({
  _csrf: csrfToken,
  title: "Buy milk",
  dueDate: new Date().toISOString(),
  completed: false,
  });
  const groupedTodosResponse = await agent
  .get("/todo")
  .set("Accept", "application/json"); 
  const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
  expect (parsedGroupedResponse.tdue).toBeDefined();
  const dueTodayCount = parsedGroupedResponse.tdue.length; 
  const latestTodo = parsedGroupedResponse.tdue [dueTodayCount - 1];
  res = await agent.get("/todo"); 
    csrfToken = extractCsrfToken (res);
    const deletedResponse = await agent.delete(`/todos/${latestTodo.id}`).send({
    _csrf: csrfToken,
    });
    expect (deletedResponse.statusCode).toBe (200);
  });
});

  /*test("Fetches all todos in the database using /todos endpoint", async () => {
    await agent.post("/todos").send({
      title: "Buy xbox",
      dueDate: new Date().toISOString(),
      completed: false,
    });
    await agent.post("/todos").send({
      title: "Buy ps3",
      dueDate: new Date().toISOString(),
      completed: false,
    });
    const response = await agent.get("/todos");
    const parsedResponse = JSON.parse(response.text);

    expect(parsedResponse.length).toBe(4);
    expect(parsedResponse[3]["title"]).toBe("Buy ps3");
  });*/
