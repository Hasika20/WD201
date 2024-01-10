'use strict';
const {Model} = require('sequelize');
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
    static addTodo({title, dueDate}){
      return this.create({ title: title, dueDate: dueDate, completed: false})
    }
    markAsCompleted() {
      return this.update({ completed: true });
    } 
    static deleteTodo(id) {
      return this.destroy({ where: { id } });
    }       
  }
  Todo.init({
    title: {
       type: DataTypes.STRING,
       allowNull: false,
       validate: {
          notEmpty: true,
       },
    },
    dueDate: {
       type: DataTypes.DATEONLY,
       allowNull: false,
       validate: {
          isDate: true,
       },
    },
    completed: {
       type: DataTypes.BOOLEAN,
       defaultValue: false,
    },
 }, {
    sequelize,
    modelName: 'Todo',
 });
 
  return Todo;  
};
