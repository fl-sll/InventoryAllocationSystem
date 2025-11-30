export default (sequelize, DataTypes) => {
  const Stock = sequelize.define(
    "Stock",
    {
      warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      tableName: "stocks",
      underscored: true,
    }
  );

  Stock.associate = (models) => {
    Stock.belongsTo(models.Warehouse, { foreignKey: "warehouse_id" });
    Stock.belongsTo(models.Product, { foreignKey: "product_id" });
  };

  return Stock;
};
