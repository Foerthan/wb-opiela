export interface IRate {
  id: number;
  client_id: number;
  start_weight: string | null;
  end_weight: string | null;
  zone: string | null;
  rate: string | null;
  shipping_speed: string | null;
  locale: string | null;
}

export interface IShippingCategory {
  locale: string;
  speed: string;
  zones: Set<string>;
  weightTiers: Map<string, IWeightTier>;
}

export interface IWeightTier {
  startWeight: string;
  endWeight: string;
  zoneRates: Map<string, string>;
}

export type NotNull<T> = {
  [Key in keyof T]: Exclude<T[Key], null>;
};