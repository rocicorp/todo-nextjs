import { nanoid } from "nanoid";
import { GetServerSideProps } from "next";
import { createSpace } from "../backend/data";
import { transact } from "../backend/pg";

function Page() {
  return "";
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const spaceID = nanoid(6);
  await transact(async (executor) => {
    await createSpace(executor, spaceID);
  });
  return {
    redirect: {
      destination: `/d/${spaceID}`,
      permanent: false,
    },
  };
};

export default Page;
