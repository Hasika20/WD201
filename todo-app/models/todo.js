/* eslint-disable*/
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
      Todo.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }

    static addTodo({ title, dueDateTime, userId }) {
      return this.create({
        title: title,
        dueDateTime: dueDateTime,
        completed: false,
        userId,
      });
    }

    static getTodos() {
      return this.findAll();
    }

    markAsCompleted() {
      return this.update({ completed: true });
    }
    setCompletionStatus(completed) {
      if (completed === true) {
        return this.update({ completed: true });
      } else {
        return this.update({ completed: false });
      }
    }
    static completedItem(userId) {
      return this.findAll({
        where: {
          userId,
          completed: true,
        },
      });
    }
    // I added the below 3 methods, overdue dueToday and dueLater to implement the todo app in the instaractors way
    static overdue(userId) {
      return this.findAll({
        where: {
          dueDateTime: {
            [Op.lt]: new Date(),
          },
          userId,
          completed: false,
        },
      });
    }
    static dueToday(userId) {
      return this.findAll({
        where: {
          dueDateTime: {
            [Op.eq]: new Date(),
          },
          userId,
          completed: false,
        },
      });
    }
    static dueLater(userId) {
      return this.findAll({
        where: {
          dueDateTime: {
            [Op.gt]: new Date(),
          },
          userId,
          completed: false,
        },
      });
    }

    static async remove(id, userId) {
      return this.destroy({
        where: {
          id,
          userId,
        },
      });
    }
  }
  Todo.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          len: 5,
        },
      },
      dueDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
