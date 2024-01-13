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
      Todo.belongsTo(models.User,{
        foreignKey: 'userId',
      })
    }

    static addTodo({ title, dueDate, userId }) {
      return this.create({ title: title, dueDate: dueDate, completed: false, userId });
    }

    markAsCompleted() {
      return this.update({ completed: true });
    }

    static async odue(userId){
      return this.findAll({
        where:{
          dueDate:{[Op.lt]:new Date()},
          userId,
          completed:false,
        }
      });
    }
    static async tdue(userId){
      return this.findAll({
        where:{
          dueDate:{[Op.eqt]:new Date()},
          userId,
          completed:false,
        }
      });    }
    static async ldue(userId){
      return this.findAll({
        where:{
          dueDate:{[Op.gt]:new Date()},
          userId,
          completed:false,
        }
      });
    }
    static async remove(id){
      return this.destroy({
        where:{
          id,
          
        },
      });
    }

    
    

    static async completedItems(userId){
      return this.findAll({
        where:{
          completed:true,
          userId,
        },
      });
    }

    setCompletionStatus(completed) {
      return this.update({ completed });
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
    }
  );
  return Todo;
};
