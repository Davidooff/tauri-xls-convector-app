export interface SelectedHeaders {
  [key: string]: {
    name: string | null;
    ldifName: string | null;
    defaultValue: string | null;
  };
}
