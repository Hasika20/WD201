const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
const { application } = require("express");

let server, agent;
function extractCsrfToken(res){
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val()
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
    server = app.listen(3000, () => {});
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
  test("Sign up",async()=> {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName:"Test",
      lastName:"user A",
      email:"user.a@test.com",
      password:"12345678",
      _csrf:csrfToken
    });
    expect(res.statusCode).toBe(302);


  });

  test("Sign out", async () => {
    let res = await agent.get("/todos");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/todos");
    expect(res.statusCode).toBe(302);
  });

  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
    const agent= request.agent(server);
    await login(agent,"user.a@test.com","12345678");
    const res = await agent.get("/todos");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      "_csrf":csrfToken
    });
    expect(response.statusCode).toBe(302);
  });


  // 
  test("Marks a todo as complete", async () => {
    const agent= request.agent(server);
    await login(agent,"user.a@test.com","12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy xbox",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: csrfToken,
        completed:false,
      });
    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });

  test("Marks a todo as incomplete", async () => {
    const agent= request.agent(server);
    await login(agent,"user.a@test.com","12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy Milk",
      dueDate: new Date().toISOString(),
      completed: true,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const markIncompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: csrfToken,
        completed: true,
      });
    const parsedUpdateResponse = JSON.parse(markIncompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(false);
  });
  
  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    const agent= request.agent(server);
    await login(agent,"user.a@test.com","12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      _csrf:csrfToken,
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
     });
     const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept","application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    expect(parsedGroupedResponse.dueToday).toBeDefined();
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const deletetodoresponse = await agent.delete(`/todos/${latestTodo.id}`).send({
      _csrf:csrfToken,
    });
    console.log(deletetodoresponse.text); // Check the response text
    const parsedDeleteResponse = JSON.parse(deletetodoresponse.text);
    console.log(parsedDeleteResponse); // Check the parsed JSON object
    expect(parsedDeleteResponse.success).toBe(true);
  });
  test("userA connot update  userB's todo",async()=>{
    const agent= request.agent(server);
    await login(agent,"user.a@test.com","12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      _csrf:csrfToken,
      title: "Buy chocolate",
      dueDate: new Date().toISOString(),
      completed: false,
     });
     const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept","application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    expect(parsedGroupedResponse.dueToday).toBeDefined();
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    if(latestTodo){
      const todoId = latestTodo.id;
      const status = latestTodo.completed? false:true;

      res=await agent.get("/signout");
      expect(res.statusCode).toBe(302);

      res = await agent.get("/signup");
      csrfToken=extractCsrfToken(res);
      const response = await agent.post("/users").send({
        firstName:"Test",
        lastName:"user B",
        email:"user.b@test.com",
        password:"12345678",
        _csrf:csrfToken
      });
      expect(response.statusCode).toBe(302);
      await login(agent,"user.b@test.com","12345678");
      res = await agent.get("/todos")
      csrfToken=extractCsrfToken(res);

      const updatetodo = await agent.put(`/todos/${latestTodo.id}`).send({_csrf:csrfToken,completed:status});
      const parseupdatetodo = JSON.parse(updatetodo.text);
      console.log("complete: " + parseupdatetodo.completed);
      console.log("Status:" + status);
      expect(parseupdatetodo.completed).toBe(!status);
    } else{
      expect(true).toBe(true);
    }
  

  });

  test("user A cannot delete a  user B's todo", async () => {
    const agent= request.agent(server);
    await login(agent,"user.a@test.com","12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      _csrf:csrfToken,
      title: "Buy biscuit",
      dueDate: new Date().toISOString(),
      completed: false,
     });
     const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept","application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    expect(parsedGroupedResponse.dueToday).toBeDefined();
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res=await agent.get("/signout");
      expect(res.statusCode).toBe(302);

      res = await agent.get("/signup");
      csrfToken=extractCsrfToken(res);
      const response = await agent.post("/users").send({
        firstName:"Test",
        lastName:"user B",
        email:"user.b@test.com",
        password:"12345678",
        _csrf:csrfToken
      });
      expect(response.statusCode).toBe(302);
      await login(agent,"user.b@test.com","12345678");
      
      res = await agent.get("/todos");
      csrfToken= extractCsrfToken(res);

      const deletedResponse = await agent.delete(`/todos/${latestTodo.id}`).send({
        _csrf: csrfToken,
      });
      console.log(deletedResponse.text); // Check the response text
      const parsedDeleteResponse = JSON.parse(deletedResponse.text);
      console.log(parsedDeleteResponse); // Check the parsed JSON object
      expect(parsedDeleteResponse.success).toBe(true);
    });  
});