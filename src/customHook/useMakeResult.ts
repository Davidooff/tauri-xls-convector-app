import { invoke } from "@tauri-apps/api";
import { useState } from "react";
import { FieldObject } from "../types/FieldObject";
import { ldifRules } from "../types/LdifRule";
import { SelectedHeaders } from "../types/SelectedHeaders";

export function useMakeResult() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);

  const fetchResult = async (
    fields: FieldObject,
    headers: SelectedHeaders,
    ldif_rule: ldifRules
  ) => {
    setIsLoading(true);
    setIsError(false);
    setResult(null);

    try {
      let result: string = await invoke<string>("get_result", {
        rawFields: JSON.stringify(fields),
        rawHeaders: JSON.stringify(headers),
        rawLdifRules: JSON.stringify(ldif_rule),
      });
      setResult(result);
    } catch (err) {
      console.log(err);

      setIsError(true);
    }
    setIsLoading(false);
  };

  return [isLoading, isError, result, fetchResult];
}
