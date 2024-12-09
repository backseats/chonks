import { Attribute } from './Attribute';

export type ChonkData = {
  background_color: string;
  renderer: string;
  body_type: string;
  num_items_in_backpack: number;
};

export type Chonk = {
  name: string;
  image: string;
  animation_url?: string;
  attributes: Attribute[];
  bodyIndex: number;
  backgroundColor: string;
  chonkData: ChonkData;
};