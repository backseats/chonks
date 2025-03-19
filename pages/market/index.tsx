import { GetServerSideProps } from "next";

// This page won't actually render - we'll redirect before it loads
export default function MarketRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/market/traits",
      permanent: true, // Set to true for a 308 permanent redirect, false for a 307 temporary redirect
    },
  };
};
