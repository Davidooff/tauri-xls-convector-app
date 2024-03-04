import { useRef } from "react";
import { FieldObject } from "../../types/FieldObject";
import "./SelectHeaders.scss";
import classNames from "classnames";
import { SelectedHeaders } from "../../types/SelectedHeaders";
interface Props {
  headers: FieldObject | undefined;
  selectedHeaders: SelectedHeaders;
  addHeader: () => void;
  setSelectedHeaders: React.Dispatch<React.SetStateAction<SelectedHeaders>>;
}

const SelectHeaders = (props: Props) => {
  const { headers, selectedHeaders } = props;
  console.log(selectedHeaders);

  const handleClcik = (name: string, value: string) => {
    props.setSelectedHeaders((val) => {
      let updatedVal;
      if (name in val) {
        const { [name]: _, ...rest } = val;
        updatedVal = rest;
      } else {
        updatedVal = {
          ...val,
          [name]: { name: value, ldif_name: "ldifName", default_value: null },
        };
      }
      return updatedVal;
    });
  };

  const changeHeaderValue = (name: string, newValue: string) => {
    props.setSelectedHeaders((val) => {
      return { ...val, [name]: { ...val[name], name: newValue } };
    });
  };

  const changeLdifName = (name: string, newValue: string) => {
    props.setSelectedHeaders((val) => {
      return { ...val, [name]: { ...val[name], ldif_name: newValue } };
    });
  };

  const changeHeaderDefaultValue = (name: string, newValue: string) => {
    props.setSelectedHeaders((val) => {
      return {
        ...val,
        [name]: {
          ...val[name],
          default_value: newValue === "null" ? null : newValue,
        },
      };
    });
  };

  return (
    <div>
      {!headers && <span>choose headers at first</span>}
      {headers != undefined && (
        <div className="headers-list">
          {Object.keys(headers).map((el) => (
            <SelectHeadersEl
              value={
                el in selectedHeaders
                  ? String(selectedHeaders[el].name)
                  : headers[el]
              }
              name={el}
              ldifName={
                el in selectedHeaders
                  ? String(selectedHeaders[el].ldif_name)
                  : "LdifName"
              }
              defaultValue={
                el in selectedHeaders
                  ? String(selectedHeaders[el].default_value)
                  : "null"
              }
              isActive={el in selectedHeaders}
              handleClcik={handleClcik}
              changeValue={changeHeaderValue}
              changeLdifName={changeLdifName}
              changeDefaultValue={changeHeaderDefaultValue}
            />
          ))}
          <div className="add" onClick={props.addHeader}>
            +
          </div>
        </div>
      )}
    </div>
  );
};

interface SelectHeadersProps {
  value: string;
  name: string;
  ldifName: string;
  defaultValue: string | null;
  isActive: boolean;
  handleClcik: (name: string, value: string) => void;
  changeValue: (name: string, newValue: string) => void;
  changeLdifName: (name: string, newValue: string) => void;
  changeDefaultValue: (name: string, newValue: string) => void;
}

const SelectHeadersEl = (props: SelectHeadersProps) => {
  const {
    value,
    name,
    ldifName,
    defaultValue,
    isActive,
    handleClcik,
    changeValue,
    changeLdifName,
    changeDefaultValue,
  } = props;

  const inputRef = useRef<HTMLInputElement>(null);
  // console.log(name, isActive);

  return (
    <span className={classNames("list-el", { "list-el-active": isActive })}>
      <div
        className="check"
        onClick={() => {
          handleClcik(name, inputRef.current?.value || "");
        }}
      ></div>
      <input
        value={value}
        ref={inputRef}
        onChange={(event) => {
          if (isActive) {
            changeValue(name, event.target.value);
          }
        }}
      />
      <input
        value={isActive ? ldifName : "null"}
        disabled={!isActive}
        onChange={(event) => {
          if (isActive) {
            changeLdifName(name, event.target.value);
          }
        }}
      />
      <input
        value={isActive ? String(defaultValue) : "null"}
        disabled={!isActive}
        onChange={(event) => {
          if (isActive) {
            changeDefaultValue(name, event.target.value);
          }
        }}
      />
    </span>
  );
};

export default SelectHeaders;
