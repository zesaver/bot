const CryptoJS = require("crypto-js");
const { merchant_id, PrivateKey } = require("../../config");
const FormData = require("form-data");
const { token } = require("../../config");
const fetch = require("node-fetch");

const { findPaymentAndUpdate } = require("../mongodb/mongoAction");

const checkBillStatus = async (
  chatId,
  messageId,
  beneficiary,
  fine,
  bill,
  OKPO,
  fineAmount,
  orderId
) => {
  let orderStatus;
  const signatureString = `${merchant_id};${orderId}`;
  const encrypted = CryptoJS.HmacMD5(signatureString, PrivateKey).toString();

  const form = new FormData();
  form.append("merchant_id", `${merchant_id}`);
  form.append("order_id", `${orderId}`);
  form.append("signature", `${encrypted}`);

  await fetch("https://pay.concord.ua/api/check ", {
    method: "POST",
    body: form,
  })
    .then((res) => res.json())
    .then(async (json) => {
      switch (json.transactionStatus) {
        case "APPROVED":
          orderStatus = `<b>Платiж сплачено </b> ✅\n
  Отримувач: <b>${beneficiary} </b>
  IBAN: <b>${bill} </b>
  Серія та номер протоколу: <b>${fine}</b>
  Сума: <b>${fineAmount} грн </b>`;
          break;
        case "EXPIRED":
          orderStatus = `<b>Вичерпано час дії платежу, повторіть знову </b> 🔄\n`;
          break;
        case "NEW":
          orderStatus = `<b>Вичерпано час дії платежу, повторіть знову </b> 🔄\n`;
          break;
        case "DECLINED":
          orderStatus = `<b>Платiж відхилено </b> ❌\n`;
          break;
      }
      const form2 = new FormData();
      form2.append("chat_id", `${chatId}`);
      form2.append("message_id", `${messageId}`);
      form2.append("text", `${orderStatus}`);
      form2.append("parse_mode", "HTML");

      await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: "POST",
        body: form2,
      });

      await findPaymentAndUpdate(
        { countId: orderId },
        { transactionStatus: json.transactionStatus }
      );
    });
};

module.exports = { checkBillStatus };
