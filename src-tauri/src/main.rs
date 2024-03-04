// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{any, clone, collections::{linked_list, HashMap}, env, ptr::null, thread::panicking};
use translit::{Passport2013, ToLatin};
use regex::Regex;
use serde::{de::value, Deserialize, Serialize};
use serde_json::Value;
use tauri::http::header;
use rand::Rng;
use hex::encode;
use sha1::{Sha1, Digest};
use rand::distributions::Alphanumeric;


#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct HeaderRules {
    default_value: Option<String>,
    ldif_name: Option<String>,
    name: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CalculatedField {
  show: bool,
  value: String,
  ldif_name: Option<String>,
  name: Option<String>,
}
#[derive(Debug, Clone)]
struct FieldEl{
  column: String,
  value: Value
}

#[derive(Debug, Clone)]
struct HeaderRulesWithColumn {
  column: Option<String>,
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
  fields: HashMap<u32, Vec<FieldEl>>,
  calculated_fields: Vec<Vec<CalculatedField>>
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
    println!("Fields: {:?}", self.fields)
  }

  fn check_is_dep_inside(headers: &Vec<HeaderRulesWithColumn>, dependencies: Vec<String>, self_header: &HeaderRules) -> Vec<String> {
    let left_dependencies: Vec<String> = dependencies.into_iter().filter(|word| {
        let path: Vec<_> = word.split('.').collect();
        if path.len() !=  2 && (path[0] == "ldif" || path[0] == "name") {
            panic!("Wrong let path")
        } else {
            for header in headers {
              match path[0] {
                "name" => {
                    if let Some(ref name) = header.base.name {
                      if name == &path[1]{
                        return false;
                      }
                    }
                },
                "ldif" => {
                  if let Some(ref ldif) = header.base.ldif_name {
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
                    if name == &path[1]{
                      return false;
                    }
                  }
              },
              "ldif" => {
                if let Some(ref ldif) = self_header.ldif_name {
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

  fn depend_on(value: &String) -> Option<Vec<String>> {
    let regex_pattern = r"\{([^}]+)\}";
    let regex = Regex::new(regex_pattern).expect("Failed to compile regex");
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



  pub fn load_headers(&mut self, headers: &HashMap<String, HeaderRules>){
    // load all not regexp
    let regex_init_value_naf = Regex::new(r"^NotAField").expect("Failed to compile regex");
    let regex_init_value_reg = Regex::new(r"^<reg>").expect("Failed to compile regex");
    let mut to_include_later: Vec<HeaderRulesWithColumn>= Vec::new();
    for (key, val) in headers {
      // If key is NotAField set column_name as None
      let column_name: Option<String> = if !regex_init_value_naf.is_match(key) {
        Some(Self::get_letters(key))
      } else {
        None
      };
      if let Some(default_value) = &val.default_value {
        if regex_init_value_reg.is_match(default_value) {
          let dependencies = Self::depend_on(default_value);
          if let Some(dependencies) = dependencies{
            let not_inc_dep = Self::check_is_dep_inside(&self.headers_list, dependencies, val);
            if not_inc_dep.len() != 0 {
              to_include_later.push(HeaderRulesWithColumn{ column: column_name, base: val.clone()});
            } else {
              self.headers_list.push(HeaderRulesWithColumn{ column: column_name, base: val.clone()})
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
    while to_include_later.len() != 0 {
      let mut to_rem: Vec<usize> = Vec::new();
      let mut change_made: bool = false;
        for (index ,to_inc) in to_include_later.iter().enumerate() {
          if let Some(default_value) = &to_inc.base.default_value {
            if let Some(dependencies) = Self::depend_on(&default_value) {
              let not_inc_dep = Self::check_is_dep_inside(&self.headers_list, dependencies, &HeaderRules{default_value: None, ldif_name: to_inc.base.ldif_name.clone(), name: to_inc.base.name.clone()});
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
        panic!("Change was't made")
      }
    }

  }

  fn get_field_el(column: &String, field_raw: &Vec<FieldEl>) -> Option<String>{
    for field_el in field_raw {
      if field_el.column.to_string() == column.to_string() {
        return Some(field_el.value.to_string());
      }
    }
    return None;
  }

  fn get_value(&self, value: &String, header_rule: &HeaderRulesWithColumn, field_raw: &Vec<FieldEl>) -> String{
    let deps = Self::depend_on(value);

    if let Some(deps) = deps { 
      if deps.len() != 1 {
        panic!("Wrong lengs of deps in one el")
      }
      let deps = &deps[0];

      let path: Vec<&str> = deps.split(".").collect();
      if path.len() != 2 {
        panic!("Wrong path len")
      }

      let way = path[0];
      let name = path[1];
      if let Some(header_column) = &header_rule.column{
      let to_comp: &Option<String>;
      match way {
        "ldif" => to_comp = &header_rule.base.ldif_name,
        "name" => to_comp = &header_rule.base.name,

        _ => panic!("Wrong path")
      }
// 
// 
// 
// 
      if let Some(to_comp) = to_comp {
        if to_comp == name{
          if let Some(mut field_value) = Self::get_field_el(header_column, field_raw) {
            return field_value;
          } else {
            return String::new();
          }
        }
      } 
      }

      if let Some(last_calc_raw) = self.calculated_fields.last(){
        println!("{:?}", last_calc_raw);
        for header_el in last_calc_raw {
          let to_comp: &Option<String>;
          match way {
            "ldif" => to_comp = &header_el.ldif_name,
            "name" => to_comp = &header_el.name,
  
            _ => panic!("Wrong path")
          }
  
          if let Some(to_comp) = to_comp {
            if to_comp == name{
                let mut to_ret: String = header_el.value.clone();
                return to_ret;
              
            }
          } 
        }
      }
      panic!("Nothing was found by dep: {:?}", deps)
    } else {
      let is_string: Regex = Regex::new(r"'.*'").expect("Failed to compile regex");
      if let Some(mtch) = is_string.find(value){
        let to_ret: String = Self::remove_first_and_last(mtch.as_str()).to_string();
        return to_ret;
      }
      panic!("0 deps and not string {:?}", header_rule)
    }
    
  }

  fn calc_fun(value_to_ret: String, header_value: &String) -> String {
    let mut value_to_ret = value_to_ret; // Make a mutable copy of the input
    let regex_fun_name = Regex::new(r"<.*\(").expect("Regex err");
    let fun_name = regex_fun_name.find(header_value);
    if let Some(fun_name) = fun_name {
        let fun_name = Self::remove_first_and_last(fun_name.as_str());
        match fun_name {
            "mobile" => {
                let mobile_regex = Regex::new(r"[+ \-()]").expect("Regex fail");
                value_to_ret = mobile_regex.replace_all(&value_to_ret, "").into_owned();
            },
            "randNum" => {
                let length: i32 = value_to_ret.parse().unwrap();
                let mut rng = rand::thread_rng();
                let random_number = rng.gen_range(10i32.pow(length as u32 - 1)..10i32.pow(length as u32));
                value_to_ret = random_number.to_string();
            },
            "translit" => {
              let trasliterator = Passport2013::new();
              value_to_ret = trasliterator.to_latin(&value_to_ret).to_lowercase();
            },
            "SSHA" => {
              let mut hasher = Sha1::new();
              if value_to_ret == "" {
                let mut rng = rand::thread_rng();
                value_to_ret = (0..8)
                  .map(|_| rng.sample(Alphanumeric))
                  .map(char::from)
                  .collect::<String>();
                value_to_ret = value_to_ret.to_lowercase()
              }

              hasher.update(&value_to_ret);
              let result = hasher.finalize();
              value_to_ret = format!("{{SSHA}}{} #{}", encode(result), value_to_ret);

            }
            _ => panic!("No fun with name: {:?}", header_value),
        }
    }
    value_to_ret // Return the modified string
}

  fn calc_each(&self, header_rule: &HeaderRulesWithColumn, field_raw: &Vec<FieldEl>, raw_num: &u32) -> CalculatedField{
    let regex = Regex::new(r#"""#).expect("err"); // да говно код я знаю
    if let Some(header_value) = &header_rule.base.default_value {
      if let Some(header_column) = &header_rule.column{
        let to_ret = Self::get_field_el(header_column, field_raw);
          if let Some(mut to_ret) = to_ret{
            return CalculatedField {show: true, value: regex.replace_all(&to_ret, "").to_string(), ldif_name: header_rule.base.ldif_name.clone(), name: header_rule.base.name.clone()};
        }
      }

      let mut header_splited_value: Vec<_> = header_value.split(" + ").collect();
      let regex_reg = Regex::new(r"<reg>").expect("rrr");
      let replaced_value = regex_reg.replace(header_splited_value[0], "").to_string();
      header_splited_value[0] = &replaced_value;

      let mut to_ret : String = String::new();
      for header_val_el in header_splited_value {
        // if let Some(header_column) = &header_rule.column{
          let to_add: &String = &self.get_value(&header_val_el.to_string(), header_rule, field_raw);
          let to_add = Self::calc_fun(to_add.to_string(), &header_val_el.to_string());
          to_ret += to_add.as_str();
        // } else {
        //   // calc
        // }
      }

      return CalculatedField {show: true, value: regex.replace_all(&to_ret, "").to_string(), ldif_name: header_rule.base.ldif_name.clone(), name: header_rule.base.name.clone()}
      // return show true
    } else {
      if let Some(header_column) = &header_rule.column{
        let to_ret = Self::get_field_el(header_column, field_raw);
        if let Some(to_ret) = to_ret{
          return CalculatedField {show: false, value: to_ret, ldif_name: header_rule.base.ldif_name.clone(), name: header_rule.base.name.clone()};
        }
        return CalculatedField {show: false, value: String::new(), ldif_name: header_rule.base.ldif_name.clone(), name: header_rule.base.name.clone()};

        // calc show false
      } else {
        panic!("No sens no colum no default value: {:?}", header_rule);
      }
    }
  }

  pub fn calc(&mut self) {
    for (raw_num, field_raw) in &self.fields {
      self.calculated_fields.push(Vec::new());

      for header_rule in &self.headers_list{
        let to_push = self.calc_each(header_rule, field_raw, raw_num);
        if let Some(last_calc_field) = self.calculated_fields.last_mut(){
          last_calc_field.push(to_push);
        } else {
          panic!("No vec")
        }
      }
    }
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
  // parsing fields
  let fields = parse_json::<String, Value>(&raw_fields);
  let headers = parse_json::<String, HeaderRules>(&raw_headers);
  let ldif_rules = parse_json::<String, Value>(&raw_ldif_rules);
  let mut resolver = HeadresResolver {
    headers_list: Vec::new(), // Initialize with an empty vector
    fields: HashMap::new(),
    calculated_fields: Vec::new()
  };

  resolver.load_headers(&headers);
  resolver.load_fields(fields);
  println!("{:?}", resolver.headers_list);
  resolver.calc();
  println!("{:?}", resolver.calculated_fields);


  let calculated_fields_str = serde_json::to_string(&resolver.calculated_fields).unwrap();
  calculated_fields_str
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

                  } else {
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
  json_string
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![convert_filds, get_result])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
