import { Attribute } from './Attribute';
import { Category } from './Category'

export type Trait = {
  name: string;
  image: string;
  attributes: Attribute[];
  tokenId: BigInt;
  category: Category;
}