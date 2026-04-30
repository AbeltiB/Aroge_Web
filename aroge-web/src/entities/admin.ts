export type Role = {
  id: string;
  name: string;
  description: string;
  version: number;
  archived: boolean;
};

export type Permission = {
  key: string;
  resource: string;
  action: string;
};

export type AbacPolicy = {
  id: string;
  name: string;
  effect: "allow" | "deny";
  condition: string;
};

export type Kpi = {
  label: string;
  value: string;
  delta: string;
};
