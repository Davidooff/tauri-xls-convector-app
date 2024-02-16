import { useEffect, useState } from "react";
import "./App.scss";
import ProccessOrUpload from "./sections/ProcessOrUpload/ProccessOrUpload";
import { FileData } from "./types/FileData";
import LdifOu from "./sections/LdifOu/LdifOu";
import SelectHeaders from "./sections/SelectHeaders/SelectHeaders";
import { SelectedHeaders } from "./types/SelectedHeaders";
import { getFiltered } from "./sections/SelectHeaders/defaultRenaming";

const App = () => {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [selectedHeaders, setSelectedHeaders] = useState<SelectedHeaders>({});

  useEffect(() => {
    if (fileData && !Object.keys(selectedHeaders).length) {
      const newSelectedHeaders = getFiltered(fileData.body.headers);
      if (!newSelectedHeaders) {
        return;
      }
      Object.keys(newSelectedHeaders).forEach((el) => {
        if (el.match("NotAField")) {
          addHeader(el);
        }
      });
      setSelectedHeaders(newSelectedHeaders);
    }
  }, [fileData]);

  const addHeader = (name?: string) => {
    if (!fileData) {
      return;
    }
    // let newData = {fileData}
    let fieldName = name
      ? name
      : "NotAField" + Math.round(Math.random() * 1000);
    fileData.body.headers[fieldName] = "notAField";
    setFileData({ ...fileData });
  };

  return (
    <div className="main">
      <div className="main-part">
        <ProccessOrUpload fileData={fileData} setFileData={setFileData} />
        <LdifOu isActive={fileData ? true : false} />
      </div>
      <div className="main-part">
        <SelectHeaders
          headers={fileData?.body.headers}
          selectedHeaders={selectedHeaders}
          setSelectedHeaders={setSelectedHeaders}
          addHeader={addHeader}
        />
      </div>
    </div>
  );
};

export default App;
