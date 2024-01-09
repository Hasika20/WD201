// listTodos.js
const { Todo } = require('./models/index');

const listTodo = async () => {
  try {
    await Todo.showList();
  } catch (error) {
    console.error(error);
  }
};

(async () => {
  await listTodo();
})();
