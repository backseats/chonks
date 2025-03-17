import { gql } from '@apollo/client';

export const TRAIT_LISTINGS = gql`
  query chonkListings {
    traitListings {
      items {
        id
        isActive
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
      isActive
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
