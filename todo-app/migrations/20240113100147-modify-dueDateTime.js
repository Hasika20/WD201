/* eslint-disable */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    // modify the dueDate to dueDateTime and set the datatype to datetime
    //and also change the name to dueDateTime
    await queryInterface.renameColumn('Todos', 'dueDate', 'dueDateTime')
    await queryInterface.changeColumn('Todos', 'dueDateTime', {
      type: Sequelize.DataTypes.DATE
    })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    // revert the changes
    await queryInterface.renameColumn('Todos', 'dueDateTime', 'dueDate')
    await queryInterface.changeColumn('Todos', 'dueDate', {
      type: Sequelize.DataTypes.STRING
    })
  }
};
