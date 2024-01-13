"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    static associate(models) {
      Todo.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }
    static addTodo({ title, dueDate,userId }) {
      return this.create({  
        title: title,
        dueDate: dueDate,
        completed: false,
        userId,
      });
    }
    static getTodos() {
      return this.findAll();
    }

    static overdue(userId) {
      return Todo.findAll({
        where: {
          dueDate: { [Op.lt]: new Date() },
          userId,
          completed: false,
        },
        order: [["dueDate", "ASC"]],
      });
    }

    static dueToday(userId) {
      return this.findAll({
        where: {
          dueDate: { [Op.eq]: new Date() },
          completed: false,
          userId
        },
        order: [["dueDate", "ASC"]],
      });
    }

    static completed(userId) {
      return Todo.findAll({
        where: {
          completed: true,
          userId,
        },
        order: [["id", "ASC"]],
      });
    }

    static dueLater(userId) {
      return this.findAll({
        where: {
          dueDate: { [Op.gt]: new Date() },
          userId,
          completed: false,
        },
        order: [["dueDate", "ASC"]],
      });
    }

    deleteTodo({ todo }) {
      return this.destroy({
        where: {
          id: todo,
        },
      });
    }

    static async remove(id,userId) {
      return this.destroy({
        where: {
          id,
          userId,
        },
      });
    }

    markAsCompleted() {
      return this.update({ completed: true });
    }

    setCompletionStatus(complete) {
      const  status= complete === true ? false : true;
      return this.update({ completed: status });
    }

  }
  Todo.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: true,
            len: 5
        }
     },
      dueDate:{
      type: DataTypes.DATEONLY,
      allowNull:false,
      validate:{
        isDate:true,
      }
      },
      completed:{
      type:  DataTypes.BOOLEAN,
      defaultValue:false,
    },
  },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};