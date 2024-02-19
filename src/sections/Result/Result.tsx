import { useMakeResult } from "../../customHook/useMakeResult";
import { FieldObject } from "../../types/FieldObject";
import { ldifRules } from "../../types/LdifRule";
import { SelectedHeaders } from "../../types/SelectedHeaders";

interface Props {
  ldif_rules: ldifRules;
  headers: SelectedHeaders;
  fields: FieldObject;
}

const Result = (props: Props) => {
  const { ldif_rules, headers, fields } = props;

  const [isLoading, isError, result, fetchResult] = useMakeResult();
  const handle_click = () => {
    if (typeof fetchResult === "function") {
      fetchResult(fields, headers, ldif_rules);
    } else {
      console.error("fetchResult is not a function");
    }
  };

  return (
    <div className="result">
      <div className="raw top-part-result">
        <button onClick={handle_click}>Gen Result</button>
      </div>
      {isLoading && <>Loading...</>}
      {isError && <>error</>}
      {!isError && !isLoading && <>Done</>}
    </div>
  );
};

export default Result;
