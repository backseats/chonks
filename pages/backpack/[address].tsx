import { GetServerSideProps } from 'next';
import chonksTbaToChonkId from '@/chonks_tba_to_chonk_id.json'

export default function TBARedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { address } = context.params as { address: string };

  try {
    // Look up the chonk ID from the TBA address mapping
    const chonkId = (chonksTbaToChonkId as { [key: string]: number })[address];

    if (!chonkId) {
      return {
        notFound: true
      };
    }

    // Redirect to the chonk ID page
    return {
      redirect: {
        destination: `/chonks/${chonkId}`,
        permanent: false,
      },
    };

  } catch (error) {
    console.error('Error looking up TBA address:', error);
    return {
      notFound: true
    };
  }
}
