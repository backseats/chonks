import { Attribute } from './Attribute';

export type Chonk = {
  name: string;
  image: string;
  animation_url?: string;
  attributes: Attribute[];
};
