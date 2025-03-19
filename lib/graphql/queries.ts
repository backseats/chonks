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

export const GET_CHONKS_BY_EOA = gql`
query GetChonksByEOA($eoa: String!) {
  chonks(
    where: {owner: $eoa}
    limit: 1000
  ) {
    items {
      id
      owner
      activeListing
    }
    pageInfo {
      hasPreviousPage
      hasNextPage
      endCursor
      startCursor
    }
    }
  }
`;

export const GET_TRAITS_FOR_CHONK_ID = gql`
query GetTraitsForChonkId($id: BigInt!) {
  chonk(id: $id) {
    id
    owner
    tbas {
      items {
        id
        traits {
          items {
            traitInfo {
              id
              traitName
              traitType
            }
          }
        }
      }
    }
  }
}
`;
