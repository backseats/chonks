export type TraitMetadata = {
  id: string;
  traitType: string;
  traitName: string;
  release: string;
  traitIndex: number;
  dataMinterContract: string;
  creatorName: string;
  creator: string;
  colorMap: string;
  activeListing?: string;
  // activeListing?: {
  //   id: bigint;
  //   price: string;
  //   seller: string;
  //   sellerTBA: string;
  //   isActive: boolean;
  //   listingTime: string;
  //   listingTxHash: string;
  // };
};

export type TraitMetadataResponse = {
  traitMetadata: {
    items: TraitMetadata[];
  };
};
