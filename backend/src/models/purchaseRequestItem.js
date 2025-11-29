export default (sequelize, DataTypes) => {
  const PurchaseRequestItem = sequelize.define(
    "PurchaseRequestItem",
    {
      purchase_request_id: { type: DataTypes.INTEGER, allowNull: false },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "purchase_request_items",
      underscored: true,
    }
  );

  PurchaseRequestItem.associate = (models) => {
    PurchaseRequestItem.belongsTo(models.PurchaseRequest, {
      foreignKey: "purchase_request_id",
      as: "purchaseRequest",
    });
    PurchaseRequestItem.belongsTo(models.Product, { foreignKey: "product_id" });
  };

  return PurchaseRequestItem;
};
