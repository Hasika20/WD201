'use strict';
const { Model } = require('sequelize');
const { Sequelize } = require("sequelize");
const { Op } = Sequelize;

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
      return this.create({ title: title, dueDate: dueDate, completed: false })
    }

    static getTodos() {
      return this.findAll();
    }

    isOverdue() {
      const currentDate = new Date();
      if (!this.dueDate) {
        return false;
      }
      const dueDate1 = new Date(this.dueDate);
      return dueDate1 < currentDate && !this.completed;
    }

    isDueToday() {
      const currentDate = new Date();
      
      // Check if dueDate is defined
      if (!this.dueDate) {
        return false;
      }
  
      const dueDate1 = new Date(this.dueDate);
      return (
        dueDate1.getDate() === currentDate.getDate() &&
        dueDate1.getMonth() === currentDate.getMonth() &&
        dueDate1.getFullYear() === currentDate.getFullYear() &&
        !this.completed
      );
    }

    isDueLater() {
      const currentDate = new Date();
      if (!this.dueDate) {
        return false;
      }
      const dueDate1 = new Date(this.dueDate);
      return dueDate1 > currentDate && !this.completed;
    }

    markAsCompleted() {
      return this.update({ completed: true })
    }
  }
  Todo.init({
    title: DataTypes.STRING,
    dueDate: DataTypes.DATEONLY,
    completed: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Todo',
  });
  return Todo;
};
