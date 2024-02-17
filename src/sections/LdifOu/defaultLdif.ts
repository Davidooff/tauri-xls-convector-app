import { ldifRules } from "../../types/LdifRule";

export const defaulLdif: ldifRules = {
  dn: "uid=borodulina92,ou=2024,ou=zo,ou=PUET,dc=el,dc=puet,dc=edu,dc=ua",
  changetype: "add",
  objectclasses: ["top", "inetOrgPerson"],
};
