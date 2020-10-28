export const formatPrice = (num, ret) => {
  let currency = { pounds: "", pence: "" };

  if (num - Math.floor(num) === 0) {
    currency.pounds = num;
  } else {
    currency.pounds = Math.floor(num);
    currency.pence = (num - Math.floor(num)) * 100;
  }

  if (ret === "obj") {
    return currency;
  } else if (ret === "str") {
    return `£${currency.pounds}.${currency.pence}`;
  }
};

export const formatArtNo = (num) => {
  let str = num.toString();
  let append = "0";
  while (str.length < 8) {
    str = append.concat(str);
  }
  return `${str.slice(0, 3)}.${str.slice(3, 6)}.${str.slice(6, 8)}`;
};
