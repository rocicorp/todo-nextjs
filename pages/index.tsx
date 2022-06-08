import { nanoid } from "nanoid";
import { GetServerSideProps } from "next";

function Page() {
  return "";
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    redirect: {
      destination: `/d/${nanoid(6)}`,
      permanent: false,
    },
  };
};

export default Page;
