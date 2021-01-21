"use strict";
require("./mongodb/mongodb");
const Telegraf = require("telegraf");

const { bot } = require("./initBot");
const SceneGenerator = require("./Scenes");
const { Stage, session } = Telegraf;

const curScene = new SceneGenerator();
const authScene = curScene.isAuthScene();
const authNameScene = curScene.addAuthName();
const authCityScene = curScene.addAuthCity();
const CurAddFineScene = curScene.addFineScene();
const CuraddFineAmountScene = curScene.addFineAmountScene();
const CurchechAllScene = curScene.chechAllScene();
const CurisPaymentarchiveScene = curScene.isPaymentarchiveScene();
const stage = new Stage([
  authScene,
  authNameScene,
  authCityScene,
  CurAddFineScene,
  CuraddFineAmountScene,
  CurchechAllScene,
  CurisPaymentarchiveScene,
]);

bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => {
  ctx.scene.enter("isAuth");
});
bot.command("payfine", (ctx) => ctx.scene.enter("authCity"));
bot.command("changename", (ctx) => {
  ctx.scene.enter("authName");
});

bot.command("paymentarchive", (ctx) => {
  ctx.scene.enter("isPaymentarchive");
});

bot.launch();
