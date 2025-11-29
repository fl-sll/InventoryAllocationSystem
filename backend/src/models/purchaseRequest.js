export default (sequelize, DataTypes) => {
  const PurchaseRequest = sequelize.define(
    "PurchaseRequest",
    {
      reference: { type: DataTypes.STRING, allowNull: false, unique: true },
      warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.ENUM("DRAFT", "PENDING", "COMPLETED"),
        allowNull: false,
        defaultValue: "DRAFT",
      },
      vendor_name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "PT FOOM LAB GLOBAL",
      },
    },
    {
      tableName: "purchase_requests",
      underscored: true,
    }
  );

  PurchaseRequest.associate = (models) => {
    PurchaseRequest.belongsTo(models.Warehouse, { foreignKey: "warehouse_id" });
    PurchaseRequest.hasMany(models.PurchaseRequestItem, {
      foreignKey: "purchase_request_id",
      as: "items",
    });
  };

  return PurchaseRequest;
};
