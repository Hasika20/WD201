"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static addTodo({ title, dueDate }) {
      return this.create({ title: title, dueDate: dueDate, completed: false });
    }
    static getTodo() {
      return this.findAll();
    }
    static deletetodo(id) {
      return this.destroy({ where: { id } });
    }

    static async dueLater() {
      return this.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date().toISOString().split("T")[0],
          },
          // completed: false,
        },
        order: [["id", "ASC"]],
      });
    }

    static async overdue() {
      return this.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date().toISOString().split("T")[0],
          },
          // completed: false,
        },
        order: [["id", "ASC"]],
      });
    }

    static async dueToday() {
      return this.findAll({
        where: {
          dueDate: {
            [Op.eq]: new Date().toISOString().split("T")[0],
          },
          // completed: false,
        },
        order: [["id", "ASC"]],
      });
    }

    static completedItem() {
      //In order to get only completed Todos
      return this.findAll({
        where: { completed: true },
        order: [["id", "ASC"]],
      });
    }
    markAsCompleted() {
      return this.update({ completed: true });
    }
    setcompletionstatus(bool) {
      const notbool = !bool;
      return this.update({ completed: notbool });
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
