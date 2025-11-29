export default (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "Product",
    {
      name: { type: DataTypes.STRING, allowNull: false },
      sku: { type: DataTypes.STRING, allowNull: false, unique: true },
    },
    {
      tableName: "products",
      underscored: true,
    }
  );

  Product.associate = (models) => {
    Product.hasMany(models.Stock, { foreignKey: "product_id" });
    Product.hasMany(models.PurchaseRequestItem, { foreignKey: "product_id" });
  };

  return Product;
};
