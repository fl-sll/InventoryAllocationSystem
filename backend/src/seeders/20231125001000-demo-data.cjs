'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('warehouses', [
      { name: 'Central Warehouse', created_at: now, updated_at: now },
      { name: 'East Warehouse', created_at: now, updated_at: now },
    ]);

    await queryInterface.bulkInsert('products', [
      { name: 'Icy Mint', sku: 'ICYMINT', created_at: now, updated_at: now },
      { name: 'Berry Blast', sku: 'BERRYB', created_at: now, updated_at: now },
      { name: 'Tropical Punch', sku: 'TROP', created_at: now, updated_at: now },
      { name: 'Icy Watermelon', sku: 'ICYWATERMELON', created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('stocks', null, {});
    await queryInterface.bulkDelete('purchase_request_items', null, {});
    await queryInterface.bulkDelete('purchase_requests', null, {});
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('warehouses', null, {});
  },
};
