import { gql } from '@apollo/client';

// used on /market/traits
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
        traitMetadata {
          colorMap
          traitName
        }
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

// used on /market/chonks
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

// used on /market/traits and in useTraitMetadata
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
      }
    }
  }
`;

// used on /profile
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

// used on components/marketplace/TraitsSection (?)
// coming in here will be if it's actively listed later
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
              colorMap
            }
          }
        }
      }
    }
  }
}
`;

// unused
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

// basically the same as above
// query ChonkAndBackpack {
//   chonk(id: "1") {
//     tbas {
//       items {
//         id
//         traits {
//           items {
//             traitInfo {
//               id
//               traitIndex
//               traitName
//               traitType
//               colorMap
//             }
//           }
//         }
//       }
//     }
//     transactions {
//       items {
//         amount
//         bidder
//         chonkId
//         from
//         id
//         seller
//         sellerTBA
//         time
//         to
//         txHash
//         txType
//       }
//     }
//   }
// }

// unused
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

// i dont think i need this, can probably get rid of and just use a useReadContract
export const GET_TRAIT_IMAGE_BY_ID = gql`
query traitURI($id: BigInt!) {
  traitUri(id: $id) {
    tokenUri
    id
  }
}
`;

// unused
export const GET_TRAIT_LISTING = gql`
query traitListing($id: BigInt!) {
  traitListing(id: $id) {
    id
    isActive
    listingTime
    listingTxHash
    price
    seller
    sellerTBA
    traitMetadata {
      traitType
      traitName
      traitIndex
      release
      dataMinterContract
      creatorName
      creator
      colorMap
      activeListingId
    }
  }
}
`;

export const GET_ACTIVE_CHONK_LISTINGS = gql`
query activeChonkListings {
  activeChonkListings(
    orderBy: "listingTime"
    orderDirection: "desc"
    where: {isActive: true}
  ) {
    items {
      id
      isActive
      listingTime
      listingTxHash
      price
      seller
      sellerTBA
    }
  }
}
`;

export const GET_ACTIVE_TRAIT_LISTINGS = gql`
query TraitListings {
  traitListings(
    where: {isActive: true}
    orderBy: "listingTime"
    orderDirection: "desc"
  ) {
    items {
      id
      isActive
      listingTime
      listingTxHash
      sellerTBA
      seller
      price
      traitMetadata {
        traitName
        traitType
        colorMap
      }
    }
  }
}
`;

export const GET_CHONK_RECENT_SALES = gql`
query ChonkRecentSales {
  chonkTransactionHistories(
    where: {txType_in: ["ChonkBought", "ChonkBidAccepted"]}
    orderBy: "time"
    orderDirection: "desc"
  ) {
    items {
      id
      txType
      txHash
      to
      time
      sellerTBA
      seller
      from
      chonkId
      bidder
      amount
    }
  }
}
`;
