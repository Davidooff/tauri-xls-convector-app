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
  K1: {
    name: "email",
    ldif_name: "mail",
    default_value: "<reg>{name.username} + '@el.puet.edu.ua'",
  },
  C1: { name: "name", ldif_name: null, default_value: null },
  G1: { name: null, ldif_name: "employeeNumber", default_value: "''" },
  J1: { name: null, ldif_name: "l", default_value: "'Полтава'" },
  H1: {
    name: "phone",
    ldif_name: null,
    default_value: null,
  },
  I1: {
    name: null,
    ldif_name: "hPhone",
    default_value: null,
  },
  NotAField123: {
    name: "phone2",
    ldif_name: "mobile",
    default_value: "<reg><mobile({name.phone})>",
  },
  NotAField12: {
    name: null,
    ldif_name: "homePhone",
    default_value: "<reg><mobile({ldif.hPhone})>",
  },
  L1: {
    name: "department",
    ldif_name: "departmentNumber",
    default_value: "''",
  },
  N1: { name: null, ldif_name: "st", default_value: "'UA'" },
  B1: { name: "lastname", ldif_name: "sn", default_value: "''" },
  D1: { name: "Surename", ldif_name: null, default_value: null },
  NotAFieldGivenName: {
    name: "firstname",
    ldif_name: "givenName",
    default_value: "<reg><{name.name}> + ' ' + <{name.Surename}>",
  },
  F1: {
    name: null,
    ldif_name: "pass",
    default_value: null,
  },
  NotAFieldPassword: {
    name: null,
    ldif_name: "userPassword",
    default_value: "<reg><SSHA({ldif.pass}))>",
  },
  E1: {
    name: "username",
    ldif_name: "uid",
    default_value: "<reg><translit({ldif.sn})> + <randNum('2')>",
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
