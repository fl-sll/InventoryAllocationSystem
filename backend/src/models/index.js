import fs from "fs";
import path from "path";
import { Sequelize } from "sequelize";
import configfile from "../config/config.cjs";

const basename = path.basename(new URL(import.meta.url).pathname);
const env = process.env.NODE_ENV || "development";
const config = configfile[env];

const sequelize = new Sequelize(config.url, config);
const db = {};

const modelFiles = fs
  .readdirSync(path.resolve("./src/models"))
  .filter(
    (file) =>
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file !== "index.js"
  );

for (const file of modelFiles) {
  const modulePath = new URL(`./${file}`, import.meta.url);
  const module = await import(modulePath);
  const model = module.default(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
