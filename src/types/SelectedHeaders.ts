export interface SelectedHeaders {
  [key: string]: {
    name: string | null;
    ldif_name: string | null;
    default_value: string | null;
  };
}
