// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{collections::HashMap};
use serde_json::Value;

fn get_digits(raw_digits: &String) -> Vec<u32> {
  let digits: Vec<u32> = raw_digits.chars()
        .filter(|c| c.is_digit(10)) // Filter out non-digit characters
        .map(|c| c.to_digit(10).unwrap()) // Convert chars to u32
        .collect(); 
  digits
}

#[tauri::command]
fn convert_filds(raw_filds: String) -> String {
  let mut fields : HashMap<String, String> = HashMap::new();
  let mut headers : HashMap<String, String> = HashMap::new();
  let res = serde_json::from_str::<HashMap<String, Value>>(&raw_filds);
  match res {
      Ok(parsed_fields) => {
        for (key, val) in parsed_fields {
          if val.is_object(){
            let res_val_to_obj = serde_json::from_str::<HashMap<String, Value>>(&val.to_string());
            match res_val_to_obj {
                Ok(parsed_values) => {
                  let value = parsed_values.get("w");
                    if let Some(value) = value {
                      fields.insert(key.clone(), value.as_str().unwrap().to_string());
                      println!("Value parsed successfuly {}", value.to_string());

                      // chacking is it a labels(headers)
                      let key_dig = get_digits(&key);
                      if key_dig.len() == 1 && key_dig[0] == 1 {
                          headers.insert(key, value.as_str().unwrap().to_string());
                      }
                  } else {
                      println!("Value not found");
                  }
                },
                Err(e) => panic!("Failed to parse JSON: from Field Value{:?}", e),
            }
          }
        }
      }
      Err(e) => panic!("Failed to parse JSON: {:?}", e),
  }
  let fields: String = serde_json::to_string(&fields).unwrap();
  let headers: String = serde_json::to_string(&headers).unwrap();
  let json_string = format!("{{\"fields\": {}, \"headers\": {}}}", fields, headers);
  println!("{}", json_string);
  json_string
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![convert_filds])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
