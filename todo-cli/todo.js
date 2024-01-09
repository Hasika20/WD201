const todoList = () => {
    const all = [];
  
    const add = (todoItem) => all.push(todoItem);
  
    const markAsComplete = (index) => {
      all[index].completed = true;
    };
  
    const today = new Date();
    const todayDate = today.getDate();
  
    const filterByDate = (offset) => all.filter((item) => {
      const date = new Date(item.dueDate);
      return date.getDate() === todayDate + offset;
    });
  
    const overdue = () => filterByDate(-1);
  
    const dueToday = () => filterByDate(0);
  
    const dueLater = () => filterByDate(1);
  
    const toDisplayableList = (list) => list.map((item) => {
      const date = new Date(item.dueDate);
      const formattedDate = date.toISOString().split("T")[0];
      const checkbox = item.completed ? '[x]' : '[ ]';
      return `${checkbox} ${item.title}${date.getDate() === todayDate ? '' : ` ${formattedDate}`}`;
    }).join("\n");
  
    return {
      all,
      add,
      markAsComplete,
      overdue,
      dueToday,
      dueLater,
      toDisplayableList
    };
  };
module.exports=todoList;