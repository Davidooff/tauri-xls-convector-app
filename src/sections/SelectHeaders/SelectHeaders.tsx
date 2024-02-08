import { useRef } from "react";
import { FieldObject } from "../../types/FieldObject";
import "./SelectHeaders.scss";
import classNames from "classnames";
import { SelectedHeaders } from "../../types/SelectedHeaders";
interface Props {
  headers: FieldObject | undefined;
  selectedHeaders: SelectedHeaders;
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
        updatedVal = { ...val, [name]: { name: value, defaultValue: null } };
      }
      return updatedVal;
    });
  };

  const changeHeaderValue = (name: string, newValue: string) => {
    props.setSelectedHeaders((val) => {
      return { ...val, [name]: { ...val[name], name: newValue } };
    });
  };

  const changeHeaderDefaultValue = (name: string, newValue: string) => {
    props.setSelectedHeaders((val) => {
      return {
        ...val,
        [name]: {
          ...val[name],
          defaultValue: newValue === "null" ? null : newValue,
        },
      };
    });
  };

  return (
    <div>
      {!headers && <span>choose headers at first</span>}
      {headers != undefined && (
        <div>
          {Object.keys(headers).map((el) => (
            <SelectHeadersEl
              value={headers[el]}
              name={el}
              isActive={Object.keys(selectedHeaders).includes(el)}
              handleClcik={handleClcik}
              changeValue={changeHeaderValue}
              changeDefaultValue={changeHeaderDefaultValue}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface SelectHeadersProps {
  value: string;
  name: string;
  isActive: boolean;
  handleClcik: (name: string, value: string) => void;
  changeValue: (name: string, newValue: string) => void;
  changeDefaultValue: (name: string, newValue: string) => void;
}

const SelectHeadersEl = (props: SelectHeadersProps) => {
  const {
    value,
    name,
    isActive,
    handleClcik,
    changeValue,
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
        defaultValue={value}
        ref={inputRef}
        onChange={(event) => {
          if (isActive) {
            changeValue(name, event.target.value);
          }
        }}
      />
      <input
        value={isActive ? undefined : "null"}
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
