import { invoke } from "@tauri-apps/api";
import { useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import { read } from "xlsx";
import "./DragAndDrop.scss";

const fileTypes = ["TXT", "XLS"];

interface Headers {
  [key: string]: string;
}

interface Fields {
  [key: string]: string;
}
interface ConvertedFields {
  headers: Headers;
  fields: Fields;
}

function DragAndDrop() {
  const [file, setFile] = useState<ConvertedFields | null>(null);
  const [headers, setHeaders] = useState<Headers>({});
  const handleChange = async (file: File) => {
    console.log(file);
    let fields = read(await file.arrayBuffer()).Sheets;
    fields = Object.values(fields)[0];
    const rawFilds = JSON.stringify(fields);
    let formated_fields: string | ConvertedFields = await invoke<string>(
      "convert_filds",
      { rawFilds }
    );
    formated_fields = JSON.parse(formated_fields) as ConvertedFields;
    console.log(formated_fields);

    setFile(formated_fields);
  };
  return (
    <>
      {file == null && (
        <FileUploader
          handleChange={handleChange}
          name="file"
          types={fileTypes}
        />
      )}{" "}
      {file && (
        <div className="chose-headers">
          Chose headers:{" "}
          <div>
            {Object.keys(file.headers).map((el: string, index) => (
              <div>
                <input
                  type="checkbox"
                  key={index}
                  name={el}
                  onChange={(event) => {
                    if (headers && event.target.name in headers) {
                      delete headers[event.target.name];
                      setHeaders({ ...headers });
                    } else {
                      headers[el] = file.headers[el];
                      setHeaders({ ...headers });
                    }
                  }}
                />{" "}
                {file.headers[el]}
              </div>
            ))}
          </div>
        </div>
      )}
      {Object.keys(headers).length ?? headers}
    </>
  );
}

export default DragAndDrop;
