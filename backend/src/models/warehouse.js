export default (sequelize, DataTypes) => {
  const Warehouse = sequelize.define(
    "Warehouse",
    {
      name: { type: DataTypes.STRING, allowNull: false },
    },
    {
      tableName: "warehouses",
      underscored: true,
    }
  );

  Warehouse.associate = (models) => {
    Warehouse.hasMany(models.Stock, { foreignKey: "warehouse_id" });
    Warehouse.hasMany(models.PurchaseRequest, { foreignKey: "warehouse_id" });
  };

  return Warehouse;
};
