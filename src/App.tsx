import { useState } from "react";
import "./App.scss";
import ProccessOrUpload from "./sections/ProcessOrUpload/ProccessOrUpload";
import { FileData } from "./types/FileData";
import LdifOu from "./sections/LdifOu/LdifOu";
import SelectHeaders from "./sections/SelectHeaders/SelectHeaders";
import { SelectedHeaders } from "./types/SelectedHeaders";

const App = () => {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [selectedHeaders, setSelectedHeaders] = useState<SelectedHeaders>({});
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
        />
      </div>
    </div>
  );
};

export default App;
