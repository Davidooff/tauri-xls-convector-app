import { ldifRules } from "../../types/LdifRule";
import "./LdifOu.scss";

interface Props {
  isActive: boolean;
  ldifRule: ldifRules | null;
  setLdifRule: React.Dispatch<React.SetStateAction<ldifRules | null>>;
}

const LdifOu = (props: Props) => {
  const { isActive, ldifRule, setLdifRule } = props;
  function changeLdif(name: string, value: string) {
    setLdifRule((prevState) => {
      if (!prevState) {
        // Assuming ldifRules has default values for all properties
        return { dn: "", changetype: "", objectclasses: [] };
      }
      return { ...prevState, [name]: value };
    });
  }
  return (
    <>
      {isActive && (
        <div className="ldif-rules">
          <ul>
            <li>
              <span>dn:</span>
              <input
                value={ldifRule?.dn}
                onChange={(event) => changeLdif("dn", event.target.value)}
              />
            </li>
            <li>
              <span>changetype:</span>
              <input
                value={ldifRule?.changetype}
                onChange={(event) =>
                  changeLdif("changetype", event.target.value)
                }
              />
            </li>
            <li>
              <span>objectclass:</span>
              <ObjectClass
                objectClasses={ldifRule?.objectclasses as string[]}
                setLdifRule={setLdifRule}
              />
            </li>
          </ul>
        </div>
      )}
    </>
  );
};

interface ObjectClassProps {
  objectClasses: string[];
  setLdifRule: React.Dispatch<React.SetStateAction<ldifRules | null>>;
}

function ObjectClass(props: ObjectClassProps) {
  const { objectClasses, setLdifRule } = props;
  // Provide a default value for objectClasses if it's undefined
  const classes = objectClasses || [];

  return (
    <div className="object-type-inputs">
      {classes.map((el, i) => (
        <div className="object-type-input-div">
          <input
            value={el || ""} // Ensure the value is not undefined
            key={i}
            onChange={(event) =>
              setLdifRule((val) => {
                if (!val) {
                  return null;
                }
                let newVal = { ...val };
                newVal.objectclasses[i] = event.target.value;
                return newVal;
              })
            }
          />
          <span
            onClick={() => {
              setLdifRule((val) => {
                if (!val) {
                  return null;
                }
                let newVal = { ...val };
                newVal.objectclasses.splice(i, 1);
                return newVal;
              });
            }}
          >
            X
          </span>
        </div>
      ))}
      <button
        onClick={() => {
          setLdifRule((val) => {
            if (!val) {
              return null;
            }
            let newVal = { ...val };
            newVal.objectclasses.push("");
            return newVal;
          });
        }}
      >
        add
      </button>
    </div>
  );
}

export default LdifOu;
