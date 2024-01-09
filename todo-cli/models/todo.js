"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    /*static associate(models) {
      // define association here
    }*/

    static async addTask(params) {
      return await Todo.create(params);
    }

    static async showList() {
      console.log("My Todo list \n");

      console.log("Overdue");
      // FILL IN HERE
      const overduetask = await Todo.overdue();
      overduetask.forEach((task) => console.log(task.displayableString()));
      console.log("\n");

      console.log("Due Today");
      // FILL IN HERE
      const dueTodaytask = await Todo.dueToday();
      dueTodaytask.forEach((task) => console.log(task.displayableString()));

      console.log("\n");

      console.log("Due Later");
      // FILL IN HERE
      const duetask = await Todo.dueLater();
      duetask.forEach((task) => console.log(task.displayableString()));
    }

    static async overdue() {
      // FILL IN HERE TO RETURN OVERDUE ITEMS
      const { Sequelize } = require("sequelize");
      return await Todo.findAll({
        where: {
          dueDate: {
            [Sequelize.Op.lt]: new Date(),
          },
        },
      });
    }

    static async dueToday() {
      // FILL IN HERE TO RETURN ITEMS DUE tODAY
      const { Sequelize } = require("sequelize");
      const today = new Date();

      return await Todo.findAll({
        where: {
          dueDate: {
            [Sequelize.Op.gte]: today,
          },
          completed: false,
        },
      });
    }

    static async dueLater() {
      // FILL IN HERE TO RETURN ITEMS DUE LATER
      const { Sequelize } = require("sequelize");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      return await Todo.findAll({
        where: {
          dueDate: {
            [Sequelize.Op.gte]: tomorrow,
          },
          completed: false,
        },
      });
    }

    static async markAsComplete(id) {
      // FILL IN HERE TO MARK AN ITEM AS COMPLETE
      const todo = await Todo.findByPk(id);
      if (todo) {
        todo.completed = true;
        await todo.save();
      }
    }

    displayableString() {
      const checkbox = this.completed ? "[x]" : "[ ]";

      if (!(this.dueDate === new Date().toISOString().split("T")[0])) {
        return `${this.id}. ${checkbox} ${this.title} ${this.dueDate}`;
      }
      return `${this.id}. ${checkbox} ${this.title}`;
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    },
  );
  return Todo;
};