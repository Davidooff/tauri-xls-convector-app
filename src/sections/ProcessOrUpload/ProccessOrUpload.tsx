import DragAndDrop from "../../components/drag-and-drop/DragAndDrop";
import { FileData } from "../../types/FileData";
import "./ProccessOrUpload.scss";

interface Props {
  fileData: FileData | null;
  setFileData: React.Dispatch<React.SetStateAction<FileData | null>>;
}

const ProccessOrUpload = (props: Props) => {
  const { fileData, setFileData } = props;
  return (
    <div>
      {fileData === null ? (
        <div className="raw">
          <DragAndDrop fileData={fileData} setFileData={setFileData} />
        </div>
      ) : (
        <ProccessFile fileData={fileData} setFileData={setFileData} />
      )}
    </div>
  );
};

const ProccessFile = (props: Props) => {
  const { fileData, setFileData } = props;
  return (
    <>
      <div className="raw">
        <button onClick={() => setFileData(null)}>{"<- go back"}</button>
        {" " + fileData?.name}
      </div>
      <div className="raw">
        <button>Proccess file</button>
      </div>
    </>
  );
};

export default ProccessOrUpload;
