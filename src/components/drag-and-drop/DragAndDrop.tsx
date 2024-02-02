import { invoke } from "@tauri-apps/api";
import { useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import { read } from "xlsx";

const fileTypes = ["TXT", "XLS"];

function DragAndDrop() {
  const [file, setFile] = useState<File | null>(null);
  const handleChange = async (file: File) => {
    console.log(file);
    let fields = read(await file.arrayBuffer()).Sheets;
    fields = Object.values(fields)[0];
    // delete fields["!margins"];
    // delete fields["!ref"];
    // delete fields["!autofilter"];

    const rawFilds = JSON.stringify(fields);
    invoke("convert_filds", { rawFilds });
    setFile(file);
  };
  return (
    <FileUploader handleChange={handleChange} name="file" types={fileTypes} />
  );
}

export default DragAndDrop;
