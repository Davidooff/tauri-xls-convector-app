import { FieldObject } from "../../types/FieldObject";
import { SelectedHeaders } from "../../types/SelectedHeaders";

const IfContain: { [key: string]: string } = {
  K1: "Електронна пошта",
  M1: "Поштова адреса",
  C1: "Ім'я",
  G1: "ID",
  J1: "Локальний центр (місто)",
  H1: "Мобільний телефон",
  I1: "Телефон",
  L1: "Напрям",
  N1: "Країна",
  O1: "Група",
  B1: "Прізвище",
  A1: "Код фото",
  D1: "По батькові",
  F1: "Пароль",
  E1: "Логін",
};

const changeOn: SelectedHeaders = {
  K1: { name: "email", ldifName: "mail", defaultValue: "NeedToBe" },
  C1: { name: "Name", ldifName: null, defaultValue: null },
  G1: { name: null, ldifName: "employeeNumber", defaultValue: "" },
  J1: { name: null, ldifName: "l", defaultValue: "Полтава" },
  H1: {
    name: "phone2",
    ldifName: "mobile",
    defaultValue: "<reg><mobile({ldif.mobile})>",
  },
  I1: {
    name: null,
    ldifName: "homePhone",
    defaultValue: "<reg><mobile({ldif.homePhone})>",
  },
  L1: { name: "department", ldifName: "departmentNumber", defaultValue: "" },
  N1: { name: null, ldifName: "st", defaultValue: "UA" },
  B1: { name: "lastname", ldifName: "sn", defaultValue: "NeedToBe" },
  D1: { name: "Surname", ldifName: null, defaultValue: null },
  NotAFieldGivenName: {
    name: "firstname",
    ldifName: "givenName",
    defaultValue: "<reg><{name.Name}> + ' ' + <{name.Surename}>",
  },
  F1: {
    name: null,
    ldifName: "userPassword",
    defaultValue: "<reg><SSHA({ldif.userPassword})>",
  },
  E1: {
    name: "username",
    ldifName: "uid",
    defaultValue: "<reg><{ldif.uid}> + <randNum(2)>",
  },
};

export function getFiltered(headers: FieldObject): SelectedHeaders | null {
  const keys = Object.keys(IfContain);
  const allKeysPresent = keys.every(
    (key) => headers.hasOwnProperty(key) && headers[key] === IfContain[key]
  );

  if (allKeysPresent) {
    return changeOn;
  } else {
    return null;
  }
}
