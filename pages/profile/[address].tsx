import Profile from "@/pages/profile";
import { Address } from "viem";

interface Props {
    address: Address;
}

export default function ProfilePage({ address }: Props) {
    return <Profile possibleAddress={address} />;
}

export async function getServerSideProps(context: any) {
    const { address } = context.params;

    if (!address) {
        return {
            notFound: true,
        };
    }

    return {
        props: { address },
    };
}
