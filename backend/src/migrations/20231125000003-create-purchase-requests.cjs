'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_requests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      reference: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING,
      },
      warehouse_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'warehouses', key: 'id' },
        onDelete: 'CASCADE',
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('DRAFT', 'PENDING', 'COMPLETED'),
        defaultValue: 'DRAFT',
      },
      vendor_name: {
        allowNull: false,
        type: Sequelize.STRING,
        defaultValue: 'PT FOOM LAB GLOBAL',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('purchase_requests');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_purchase_requests_status";');
  },
};
