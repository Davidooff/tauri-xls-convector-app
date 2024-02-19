// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{collections::HashMap, ptr::null, thread::panicking};
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;


#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct HeaderRules {
    defaultValue: Option<String>,
    ldifName: Option<String>,
    name: Option<String>,
}
#[derive(Debug)]
struct FieldEl{
  column: String,
  value: Value
}

#[derive(Debug, Clone)]
struct HeaderRulesWithColumn {
  column: Option<char>,
  base: HeaderRules
}

struct LdifRules {
  dn: String,
  changetype: String,
  objectclass: Vec<String>
}

pub struct ResultMaker {
   
  fields: HashMap<i32, HashMap<String, Value>>, // sorted by raws
  ldif_rules: LdifRules
}

pub struct HeadresResolver {
  headers_list: Vec<HeaderRulesWithColumn>, // It will be sorted from 0 dependencies to absolut
  fields: HashMap<u32, Vec<FieldEl>>
}


impl HeadresResolver {
  pub fn get_letters(input: &str) -> String {
    input.chars().filter(|c| c.is_alphabetic()).collect()
  }

  pub fn get_digits(raw_digits: &String) -> Vec<u32> {
    let digits: Vec<u32> = raw_digits.chars()
          .filter(|c| c.is_digit(10)) // Filter out non-digit characters
          .map(|c| c.to_digit(10).unwrap()) // Convert chars to u32
          .collect(); 
    digits
  }

  fn remove_first_and_last(s: &str) -> &str {
    let start = s.find(|c: char| !c.is_whitespace()).unwrap_or(0);
    let end = s.rfind(|c: char| !c.is_whitespace()).unwrap_or_else(|| s.len());
    &s[start +  1..end]
  }

  pub fn load_fields(&mut self, fields: HashMap<String, Value>){
    println!("fields: {:?}", fields);
    for (key, val) in fields{
      let raw_numb = Self::get_digits(&key);
      // parsing number from vec
      let len = raw_numb.len() - 1;
      let index : u32 = raw_numb.iter().enumerate().map(|(index, &el)| el *  10_u32.pow(len as u32 - index as u32)).sum();
      let column = Self::get_letters(&key);
      if let Some(raw) = self.fields.get_mut(&index){
        raw.push(FieldEl{column , value: val})
      } else {
        self.fields.insert(index, Vec::new());
        if let Some(raw) = self.fields.get_mut(&index){
          raw.push(FieldEl{column , value: val});
        } else {
          panic!("Imposible");
        }
      } 
    }
    println!("{:?}", self.fields)
  }

  fn calac_every_row(){

  }

  fn depend_on(&mut self, value: &String) -> Option<Vec<String>> {
    let regex_pattern = r"\{([^}]+)\}";
    let regex = Regex::new(regex_pattern).expect("Failed to compile regex");
    println!("{}", value);
    if let Some(captures) = regex.captures(value) {
      let mut matches = Vec::new();
      for capture in regex.find_iter(value) {
          matches.push(Self::remove_first_and_last(capture.as_str()).to_string());
      }
      Some(matches)
    } else {
        None
    }
  }
  
  fn check_is_dep_inside(headers: &Vec<HeaderRulesWithColumn>, dependencies: Vec<String>, self_header: &HeaderRules) -> Vec<String> {
    let left_dependencies: Vec<String> = dependencies.into_iter().filter(|word| {
        let path: Vec<_> = word.split('.').collect();
        println!("{:?}", path);
        if path.len() !=  2 && (path[0] == "ldif" || path[0] == "name") {
            panic!("Wrong let path")
        } else {
            for header in headers {
              match path[0] {
                "name" => {
                    if let Some(ref name) = header.base.name {
                      println!("{}:{}",name, path[1] );
                      println!("{}", name == &path[1]);
                      if name == &path[1]{
                        return false;
                      }
                    }
                },
                "ldif" => {
                  if let Some(ref ldif) = header.base.ldifName {
                    println!("{}:{}",ldif, path[1] );
                    println!("{}", ldif == &path[1]);
                    if ldif == &path[1]{
                      return false;
                    }
                  }
                },
                _ => panic!("Imposible"),
              }
            }
            // check is it a self dep
            match path[0] {
              "name" => {
                  if let Some(ref name) = self_header.name {
                    println!("{}:{}",name, path[1] );
                    println!("{}", name == &path[1]);
                    if name == &path[1]{
                      return false;
                    }
                  }
              },
              "ldif" => {
                if let Some(ref ldif) = self_header.ldifName {
                  println!("{}:{}",ldif, path[1] );
                  println!("{}", ldif == &path[1]);
                  if ldif == &path[1]{
                    return false;
                  }
                }
              },
              _ => panic!("Imposible"),
            }
            true
        }
    }).collect();

    left_dependencies
}

  pub fn load_headers(&mut self, headers: &HashMap<String, HeaderRules>){
    // load all not regexp
    let regex_init_value_naf = Regex::new(r"^NotAField").expect("Failed to compile regex");
    let regex_init_value_reg = Regex::new(r"^<reg>").expect("Failed to compile regex");
    let mut to_include_later: Vec<HeaderRulesWithColumn>= Vec::new();
    for (key, val) in headers {
      // If key is NotAField set column_name as None
      let column_name = if !regex_init_value_naf.is_match(key) {
        key.chars().next()
      } else {
        None
      };
      if let Some(default_value) = &val.defaultValue {
        if regex_init_value_reg.is_match(default_value) {
          let dependencies = self.depend_on(default_value);
          if let Some(dependencies) = dependencies{
            println!("Correct header list{:?}", &self.headers_list);
            println!("dependencies {:?}", dependencies);
            let not_inc_dep = Self::check_is_dep_inside(&self.headers_list, dependencies, val);
            if not_inc_dep.len() != 0 {
              to_include_later.push(HeaderRulesWithColumn{ column: column_name, base: val.clone()});
            } else {
              self.headers_list.insert(0, HeaderRulesWithColumn{ column: column_name, base: val.clone()})
            }
          } else {
              panic!("Wrong RegEx")
          }
        } else {
          self.headers_list.insert(0, HeaderRulesWithColumn{ column: column_name, base: val.clone()})
        }
      } else {
        self.headers_list.insert(0, HeaderRulesWithColumn{ column: column_name, base: val.clone()})
      }
    }

    // Working with vec of HeaderRulesWithColumn wich was not include bks they didn't have dependenci for work
    println!("FAS {:?}", to_include_later);
    while to_include_later.len() != 0 {
      println!("1");
      let mut to_rem: Vec<usize> = Vec::new();
      let mut change_made: bool = false;
        for (index ,to_inc) in to_include_later.iter().enumerate() {
          if let Some(default_value) = &to_inc.base.defaultValue {
            if let Some(dependencies) = self.depend_on(&default_value) {
              let not_inc_dep = Self::check_is_dep_inside(&self.headers_list, dependencies, &HeaderRules{defaultValue: None, ldifName: to_inc.base.ldifName.clone(), name: to_inc.base.name.clone()});
              if not_inc_dep.len() == 0 {
                self.headers_list.push(to_inc.clone());
                to_rem.push(index);
                change_made = true;
              } 
            }
          } else {
              panic!("Imposible")
          }
        }
      // delete every header wich was dell
      to_include_later = to_include_later.into_iter().enumerate().filter(|(index, _)| !to_rem.contains(index)).map(|(_, el)| el).collect::<Vec<_>>();
      if !change_made{
        break;
      }
    }

    println!("{:?}", self.headers_list);

    println!("To inc later: {:?}", to_include_later);
    println!("All Added {:?}", self.headers_list);
  }
}






fn parse_json<TKey, TVal>(json: &String) -> HashMap<TKey, TVal>
where
    TKey: serde::de::DeserializeOwned + std::cmp::Eq + std::hash::Hash,
    TVal: serde::de::DeserializeOwned,
{
  let res = serde_json::from_str::<HashMap<TKey, TVal>>(json);
  match res {
      Ok(parsed_fields) => parsed_fields,
      Err(e) => panic!("Failed to parse JSON: {:?}", e),
  }
}

#[tauri::command]
fn get_result(raw_fields: String, raw_headers: String, raw_ldif_rules: String) -> String {
  println!("raw_fields{}", raw_fields);
  println!("raw_headers{}", raw_headers);
  println!("raw_ldif_rules{}", raw_ldif_rules);
  // parsing fields
  let fields = parse_json::<String, Value>(&raw_fields);
  println!("{:?}", fields);
  let headers = parse_json::<String, HeaderRules>(&raw_headers);
  println!("{:?}", headers);
  let ldif_rules = parse_json::<String, Value>(&raw_ldif_rules);
  println!("{:?}", ldif_rules);
  let mut resolver = HeadresResolver {
    headers_list: Vec::new(), // Initialize with an empty vector
    fields: HashMap::new()
  };

  resolver.load_headers(&headers);
  resolver.load_fields(fields);



  let a = "";
  a.to_string()
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
                      // chacking is it a labels(headers)
                      let key_dig = HeadresResolver::get_digits(&key);
                      if key_dig.len() == 1 && key_dig[0] == 1 {
                          headers.insert(key, value.as_str().unwrap().to_string());
                          continue;
                      }
                      fields.insert(key.clone(), value.as_str().unwrap().to_string());
                      println!("Value parsed successfuly {}", value.to_string());

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
    .invoke_handler(tauri::generate_handler![convert_filds, get_result])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
