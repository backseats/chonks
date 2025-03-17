import { gql } from '@apollo/client';

export const TRAIT_LISTINGS = gql`
  query chonkListings {
    traitListings(where: {isActive: true}) {
      items {
        id
        listingTime
        listingTxHash
        price
        seller
        sellerTBA
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
    }
  }
`;

export const GET_CHONK_LISTINGS = gql`
query chonkListings {
  activeChonkListings(where: {isActive: true}) {
    items {
      id
      listingTime
      listingTxHash
      price
      seller
      sellerTBA
    }
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
      startCursor
    }
  }
}
`;

export const GET_TRAIT_METADATA_BY_ID = gql`
  query TraitMetadataById($id: BigInt!) {
    traitMetadata(where: { id: $id }) {
      items {
        id
        traitType
        traitName
        release
        traitIndex
        dataMinterContract
        creatorName
        creator
        colorMap
        activeListing
      }
    }
  }
`;
