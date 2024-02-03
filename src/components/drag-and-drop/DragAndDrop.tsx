import { invoke } from "@tauri-apps/api";
import { FileUploader } from "react-drag-drop-files";
import { read } from "xlsx";
import "./DragAndDrop.scss";
import { ConvertedFields } from "../../types/ConvertedFields";
import { FileData } from "../../types/FileData";

const fileTypes = ["TXT", "XLS"];

interface Props {
  fileData: FileData | null;
  setFileData: React.Dispatch<React.SetStateAction<FileData | null>>;
}

function DragAndDrop(props: Props) {
  const { fileData, setFileData } = props;
  const handleChange = async (file: File) => {
    if (!file) {
      return;
    }
    let fields = read(await file.arrayBuffer()).Sheets;
    fields = Object.values(fields)[0];
    const rawFilds = JSON.stringify(fields);
    let formated_fields: string | ConvertedFields = await invoke<string>(
      "convert_filds",
      { rawFilds }
    );
    formated_fields = JSON.parse(formated_fields) as ConvertedFields;
    console.log(formated_fields);

    setFileData({ body: formated_fields, name: file.name });
  };
  return (
    <>
      {fileData == null && (
        <FileUploader
          handleChange={handleChange}
          name="file"
          types={fileTypes}
          classes="file-uploader"
        />
      )}
    </>
  );
}

export default DragAndDrop;
