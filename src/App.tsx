import { useState } from "react";
import "./App.scss";
import ProccessOrUpload from "./sections/ProcessOrUpload/ProccessOrUpload";
import { FileData } from "./types/FileData";
import LdifOu from "./sections/LdifOu/LdifOu";

const App = () => {
  const [fileData, setFileData] = useState<FileData | null>(null);
  return (
    <div className="main">
      <div className="main-part">
        <ProccessOrUpload fileData={fileData} setFileData={setFileData} />
        <LdifOu isActive={fileData ? true : false} />
      </div>
      <div className="main-part"></div>
    </div>
  );
};

export default App;
