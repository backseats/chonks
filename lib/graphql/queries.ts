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
        tokenURI
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
              tokenURI
            }
          }
        }
      }
    }
  }
}
`;

export const GET_CHONK_HISTORY = gql`
query GetChonkHistory($id: BigInt!) {
  chonk(id: $id) {
    id
    owner
    tbas {
      items {
        traits {
          items {
            traitInfo {
              id
              traitName
              traitType
            }
          }
        }
        id
      }
    }
    transactions {
      items {
        amount
        bidder
        from
        id
        seller
        sellerTBA
        txType
        txHash
        to
        time
      }
    }
  }
}
`;

export const GET_TRAIT_HISTORY = gql`
query GetTraitHistory($id: BigInt!) {
  traitTransactionHistories(where: {traitId: $id}) {
    items {
      amount
      bidder
      from
      id
      seller
      sellerTBA
      time
      to
      traitId
      txHash
      txType
    }
  }
}
`;
