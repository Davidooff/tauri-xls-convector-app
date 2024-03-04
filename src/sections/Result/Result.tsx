import { useEffect, useState } from "react";
import { useMakeResult } from "../../customHook/useMakeResult";
import { FieldObject } from "../../types/FieldObject";
import { ldifRules } from "../../types/LdifRule";
import { SelectedHeaders } from "../../types/SelectedHeaders";
import { CalculatedHeaders } from "../../types/CalcedHeaders";
import path from "path";
import { BaseDirectory, writeTextFile } from "@tauri-apps/api/fs";

interface Props {
  ldif_rules: ldifRules;
  headers: SelectedHeaders;
  fields: FieldObject;
}

interface ResultToShow {
  ldif: Array<Array<[string, string]>>;
  sql: Array<Array<[string, string]>>;
}

const Result = (props: Props) => {
  const { ldif_rules, headers, fields } = props;

  const [resultToShow, setResultToShow] = useState<ResultToShow | null>(null);
  const [show, setShow] = useState<"ldif" | "sql">("sql");

  const [isLoading, isError, result, fetchResult] = useMakeResult();
  const handle_click = () => {
    if (typeof fetchResult === "function") {
      fetchResult(fields, headers, ldif_rules);
    } else {
      console.error("fetchResult is not a function");
    }
  };

  useEffect(() => {
    if (typeof result == "string") {
      let ldif: Array<Array<[string, string]>> = [];
      let sql: Array<Array<[string, string]>> = [];
      let parsed_res: CalculatedHeaders = JSON.parse(result);
      parsed_res.forEach((el, i) => {
        let dn: string = ldif_rules.dn;
        const regex = /{.*}/g;
        let search = ldif_rules.dn.match(regex);
        if (search) {
          let path = search[0].slice(1, -1).split(".");
          el.forEach((el) => {
            switch (path[0]) {
              case "ldif": {
                if (path[1] == el.ldif_name) {
                  dn = ldif_rules.dn.split(regex).join(el.value);
                }
                break;
              }
              case "name": {
                if (path[1] == el.name) {
                  dn = ldif_rules.dn.split(regex).join(el.value);
                }
                break;
              }
              default:
                console.error("Wrong path: ", path);
            }
          });
        }

        let push_into_ldif = el
          .filter((el) => el.show && el.ldif_name)
          .map((el) => [el.ldif_name as string, el.value]);
        let push_into_sql = el
          .filter((el) => el.show && el.name)
          .map((el) => [el.name as string, el.value]);

        push_into_ldif = [
          ["dn", dn],
          ["changetype", ldif_rules.changetype],
          ...ldif_rules.objectclasses.map((el) => ["objectclass", el]),
          ...push_into_ldif,
        ];

        push_into_sql = [
          ["auth", "cas"],
          ["confirmed", "1"],
          ["mnethostid", "1"],
          ...push_into_sql,
        ];
        ldif[i] = push_into_ldif as [string, string][];
        sql[i] = push_into_sql as [string, string][];
      });

      console.log("all: ", parsed_res);
      console.log("ldif: ", ldif);
      console.log("sql: ", sql);

      let write_ldif = ldif
        .map(
          (el, i) =>
            "#entry #" +
            (i + 1) +
            "\n" +
            el.map((el) => el[0] + ": " + el[1]).join("\n")
        )
        .join("\n\n");

      let write_sql =
        "INSERT INTO mdl_user(" +
        sql[0].map((el) => "`" + el[0] + "`").join(", ") +
        ") VALUES \n" +
        sql
          .map(
            (el) => "(" + el.map((inEl) => "'" + inEl[1] + "'").join(", ") + ")"
          )
          .join(", \n");

      (async () => {
        await writeTextFile("ldif.txt", write_ldif, {
          dir: BaseDirectory.Download,
        });
        console.log(1);
      })();

      (async () => {
        await writeTextFile("sql.txt", write_sql, {
          dir: BaseDirectory.Download,
        });
        console.log(1);
      })();
      setResultToShow({ ldif, sql });
    }
  }, [result]);

  return (
    <div className="result">
      <div className="raw top-part-result">
        <div>
          {result && !isLoading && !isError && (
            <>
              <button
                onClick={() => {
                  setShow("sql");
                }}
              >
                SQL
              </button>
              <button
                onClick={() => {
                  setShow("ldif");
                }}
              >
                LDIF
              </button>
            </>
          )}
        </div>
        <button onClick={handle_click}>Gen Result</button>
      </div>
      {isLoading && (
        <>
          Loading... <br />
        </>
      )}
      {isError && (
        <>
          error <br />
        </>
      )}
      {result && resultToShow && <> {PretifyRes(resultToShow, show)} </>}
    </div>
  );
};

function PretifyRes(resultToShow: ResultToShow, show: "ldif" | "sql") {
  if (show == "ldif") {
    return (
      <>
        {resultToShow.ldif.map((el, i) => {
          return (
            <>
              # entry # {i + 1} <br />
              {el.map((el) => {
                return (
                  <>
                    {el[0]}: {" " + el[1]}
                    <br />
                  </>
                );
              })}
              <br />
            </>
          );
        })}
      </>
    );
  }

  if (show == "sql") {
    return (
      <>
        INSERT INTO mdl_user(
        {resultToShow.sql[0].map((el) => "`" + el[0] + "`").join(", ")}) VALUES{" "}
        <br />
        {resultToShow.sql.map((el, i) => (
          <>
            ({el.map((el) => "'" + el[1] + "'").join(", ")}){" "}
            {i != length - 1 && <>,</>} <br />{" "}
          </>
        ))}
      </>
    );
  }
}

export default Result;
