// import { GetServerSideProps } from 'next';
// import { tokenboundClient } from '@/lib/tokenbound';
// import { mainContract } from '@/lib/contracts';

// export default function TBARedirect() {
//   return null;
// }

// export const getServerSideProps: GetServerSideProps = async (context) => {
//   const { tba_address } = context.params as { tba_address: string };

//   try {
//     // Get all chonks
//     const allChonks = await tokenboundClient.getAllAccounts(mainContract);

//     // Find the chonk ID that matches this TBA address
//     const matchingChonk = allChonks.find(account =>
//       account.toLowerCase() === tba_address.toLowerCase()
//     );

//     if (!matchingChonk) {
//       return {
//         notFound: true
//       };
//     }

//     // Redirect to the chonk ID page
//     return {
//       redirect: {
//         destination: `/chonks/${matchingChonk.tokenId}`,
//         permanent: false,
//       },
//     };

//   } catch (error) {
//     console.error('Error looking up TBA address:', error);
//     return {
//       notFound: true
//     };
//   }
// }
