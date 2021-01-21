const fetch = require("node-fetch");
const FormData = require("form-data");
const CryptoJS = require("crypto-js");
const moment = require("moment");
const { bot } = require("./initBot");

const { commands } = require("./commands");
const {
  merchant_id,
  PrivateKey,
  callbackUrlStatusOrder,
} = require("../config");
const billLibrary = require("./bill");
const { findLastBill } = require("./mongodb/mongoAction");
const { writeData } = require("./google-sheets");

const {
  getChatidAndUserId,
} = require("../server/controllers/getstatusbillController");
const { checkBillStatus } = require("./helpers/checkBillStatus");
const Scene = require("telegraf/scenes/base");
const Markup = require("telegraf/markup");
const {
  Payment,
  createUser,
  findUser,
  findUserAndUpdate,
} = require("./mongodb/mongoAction");

class SceneGenerator {
  isPaymentarchiveScene() {
    const isPaymentarchive = new Scene("isPaymentarchive");
    isPaymentarchive.enter((ctx) => {
      findLastBill(ctx.from.id).then((billArry) => {
        if (billArry.length === 0) {
          ctx.reply("Успiшних платежiв немає");
          return;
        }

        const html = billArry
          .map((el) => {
            return `<b>Отримувач:</b> ${el.city} 
<b>Сума:</b> ${el.price} 
<b>Дата платежу:</b> ${el.date}
<b>Постанова:</b> ${el.fine}
<i>Замовити квитанцiю:</i> /download${el.countId}`;
          })
          .join("\n \n");
        ctx.replyWithHTML(html);

        for (let bill of billArry) {
          bot.hears(`/download${bill.countId}`, async (ctx) => {
            writeData(bill);
            ctx.reply("Квитанцiя в обробцi");
          });
        }
      });
    });
    return isPaymentarchive;
  }

  isAuthScene() {
    const isAuth = new Scene("isAuth");
    isAuth.enter((ctx) => {
      findUser(ctx.from.id).then((data) => {
        if (!data) {
          createUser(ctx.from.id);
          ctx.scene.leave();
          ctx.scene.enter("authName");
        } else {
          ctx.scene.leave();
          ctx.scene.enter("authCity");
        }
        return data;
      });
    });

    return isAuth;
  }
  addAuthName() {
    const authName = new Scene("authName");
    authName.enter((ctx) => {
      ctx.reply("Введіть прізвище, ім'я, по батькові");
    });
    authName.on("text", (ctx) => {
      const isEnterCommand = commands.some((el) => el === ctx.message.text);
      if (isEnterCommand) {
        switch (ctx.message.text) {
          case "/start":
            ctx.scene.leave();
            ctx.scene.enter("isAuth");
            break;
          case "/payfine":
            ctx.scene.leave();
            ctx.scene.enter("authCity");
            break;
          case "/paymentarchive":
            ctx.scene.leave();
            ctx.scene.enter("isPaymentarchive");
            break;
          case "/changename":
            ctx.scene.leave();
            ctx.scene.enter("authName");
            break;
        }
      } else {
        findUserAndUpdate({ idUser: ctx.from.id }, { name: ctx.message.text });
        ctx.reply(`Вiтаю ${ctx.message.text}`);
        ctx.scene.enter("isAuth");
      }
    });

    return authName;
  }

  addAuthCity() {
    const authCity = new Scene("authCity");

    authCity.enter((ctx) => {
      const arryOfCity = billLibrary.map((el) => el.city);

      const buttons = arryOfCity
        .map((key) => Markup.callbackButton(key, key))
        .reduceRight((acc, cur, idx) => {
          const index = parseInt(idx / 2, 10);

          acc[index] = acc[index] || [];
          acc[index].push(cur);

          return acc;
        }, []);
      ctx.reply(
        "Оберіть місто зі списку",

        {
          ...Markup.inlineKeyboard(buttons).extra(),
          parse_mode: "Markdown",
        }
      );
    });
    const arryOfCity = billLibrary.map((el) =>
      authCity.action(el.city, (ctx) => {
        cityBillLibrary(el.city, ctx);
      })
    );

    function cityBillLibrary(cityName, ctx) {
      const searchCity = billLibrary.find((el) => el.city === cityName);
      ctx.scene.state.bill = searchCity.bill;
      ctx.scene.state.OKPO = searchCity.OKPO;
      ctx.scene.state.beneficiaryName = searchCity.beneficiaryName;
      // console.log(ctx.from.id, ctx.scene.state);
      ctx.scene.leave();

      ctx.scene.enter("addFine", ctx.scene.state);
    }
    return authCity;
  }

  addFineScene() {
    const addFine = new Scene("addFine");
    addFine.enter((ctx) => {
      ctx.reply("Введіть серію та номер постанови");
    });
    addFine.on("text", (ctx) => {
      const isEnterCommand = commands.some((el) => el === ctx.message.text);
      if (isEnterCommand) {
        switch (ctx.message.text) {
          case "/start":
            ctx.scene.leave();
            ctx.scene.enter("isAuth");
            break;
          case "/payfine":
            ctx.scene.leave();
            ctx.scene.enter("authCity");
            break;
          case "/paymentarchive":
            ctx.scene.leave();
            ctx.scene.enter("isPaymentarchive");
            break;
          case "/changename":
            ctx.scene.leave();
            ctx.scene.enter("authName");
            break;
        }
      } else {
        ctx.scene.state.fine = ctx.message.text;
        ctx.scene.leave();
        ctx.scene.enter("addFineAmount", ctx.scene.state);
      }
    });
    return addFine;
  }

  addFineAmountScene() {
    const addFineAmount = new Scene("addFineAmount");
    addFineAmount.enter((ctx) => {
      ctx.reply("Введіть суму штрафу");
    });
    addFineAmount.on("text", async (ctx) => {
      const isEnterCommand = commands.some((el) => el === ctx.message.text);
      if (isEnterCommand) {
        switch (ctx.message.text) {
          case "/start":
            ctx.scene.leave();
            ctx.scene.enter("isAuth");
            break;
          case "/payfine":
            ctx.scene.leave();
            ctx.scene.enter("authCity");
            break;
          case "/paymentarchive":
            ctx.scene.leave();
            ctx.scene.enter("isPaymentarchive");
            break;
          case "/changename":
            ctx.scene.leave();
            ctx.scene.enter("authName");
            break;
        }
      } else {
        const currAmount = Number(ctx.message.text);
        if (currAmount) {
          ctx.scene.state.fineAmount = ctx.message.text;
          ctx.scene.leave();
          ctx.scene.enter("chechAll", ctx.scene.state);
        } else {
          await ctx.reply("Букви не приймаються");
          ctx.scene.reenter();
        }
      }
    });

    return addFineAmount;
  }

  chechAllScene() {
    const chechAll = new Scene("chechAll");
    chechAll.enter((ctx) => {
      const getUserName = async () => {
        const user = await findUser(ctx.from.id).then((data) => {
          return data;
        });

        return user;
      };

      getUserName().then((userDb) => {
        const idUser = userDb.idUser;
        const userName = userDb.name;

        const billDescription = `Отримувач:${ctx.scene.state.beneficiaryName}|IBAN:${ctx.scene.state.bill}|ЄДРПОУ:${ctx.scene.state.OKPO}|Призначення:*;21081100;${ctx.scene.state.fine};*${userName}`;

        const postBill = async (userId, userName, city, price, ufine) => {
          const bill = {
            user: userId,
            userName: userName,
            city: city,
            price: price,
            fine: ufine,
            date: moment().format("YYYY-MM-DD HH:mm:ss"),
            transactionStatus: null,
          };
          await Payment.create(bill, (err, billWithCount) => {
            if (err) console.log(err);

            console.log("Есть платеж", billWithCount);
            let html = `Перевірте введені реквізити: \n
ПIБ: <b>${userName} </b>\n
Отримувач: <b>${ctx.scene.state.beneficiaryName} </b>\n
Серія та номер постанови: <b>${ctx.scene.state.fine}</b>\n
IBAN: ${ctx.scene.state.bill} \n
ЄДРПОУ: ${ctx.scene.state.OKPO} \n
Сума: <b>${ctx.scene.state.fineAmount} грн </b>\n`;
            const messageId = ctx.message.message_id + 1;
            const chatId = ctx.from.id;
            getConcordUrl(
              billDescription,
              billWithCount,
              messageId,
              chatId
            ).then((url) => {
              ctx.replyWithHTML(
                html,
                Markup.inlineKeyboard([
                  Markup.urlButton("Перейти на сторiнку оплати", url),
                ]).extra()
              );
            });
          });
        };
        postBill(
          idUser,
          userName,
          ctx.scene.state.beneficiaryName,
          ctx.scene.state.fineAmount,
          ctx.scene.state.fine
        );
      });

      const getConcordUrl = async (
        billDescription,
        billWithCount,
        messageId,
        chatId
      ) => {
        let orderId = billWithCount.countId;
        const signatureString = `${merchant_id};${orderId};${ctx.scene.state.fineAmount};UAH;${billDescription}`;
        const encrypted = CryptoJS.HmacMD5(
          signatureString,
          PrivateKey
        ).toString();

        getChatidAndUserId(
          chatId,
          messageId,
          ctx.scene.state.beneficiaryName,
          ctx.scene.state.fine,
          ctx.scene.state.bill,
          ctx.scene.state.OKPO,
          ctx.scene.state.fineAmount,
          orderId
        );
        const form = new FormData();
        form.append("operation", "Purchase");
        form.append("merchant_id", `${merchant_id}`);
        form.append("amount", `${ctx.scene.state.fineAmount}`);
        form.append("signature", `${encrypted}`);
        form.append("order_id", orderId);
        form.append("currency_iso", "UAH");
        form.append("description", `${billDescription}`);
        form.append("approve_url", `https://telegram.me/parkingfinesbot`);
        form.append("decline_url", `https://telegram.me/parkingfinesbot`);
        form.append("cancel_url", `https://telegram.me/parkingfinesbot`);
        form.append("callback_url", `${callbackUrlStatusOrder}`);
        setTimeout(check, 5 * 60 * 1000); // set 5 min to get check status bill

        return await fetch("https://pay.concord.ua/api/", {
          method: "POST",
          body: form,
        })
          .then((res) => res)
          .then((res) => {
            return res.url;
          });

        async function check() {
          await checkBillStatus(
            chatId,
            messageId,
            ctx.scene.state.beneficiaryName,
            ctx.scene.state.fine,
            ctx.scene.state.bill,
            ctx.scene.state.OKPO,
            ctx.scene.state.fineAmount,
            orderId
          );
        }
      };
    });

    return chechAll;
  }
}

module.exports = SceneGenerator;
