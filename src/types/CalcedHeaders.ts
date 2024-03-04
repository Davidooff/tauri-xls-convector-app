interface CalculatedHeader {
  show: boolean;
  ldif_name: string | null;
  name: string | null;
  value: string;
}

export type CalculatedHeaders = Array<CalculatedHeader[]>;
