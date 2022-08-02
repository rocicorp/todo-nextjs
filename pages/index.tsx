import { nanoid } from "nanoid";
import { GetServerSideProps } from "next";
import { createSpace } from "replicache-nextjs/lib/backend";

function Page() {
  return "";
}

// This is the entrypoint for the application.
//
// Next.js runs this function server-side (see:
// https://nextjs.org/docs/basic-features/data-fetching/get-server-side-props).
//
// We randomly generate a new list ID and create a "space" for its data server-
// side, then redirect to /list/<id>.
export const getServerSideProps: GetServerSideProps = async () => {
  // Create a new random list and corresponding space on the backend.
  const listID = nanoid(6);
  await createSpace(listID);
  return {
    redirect: {
      destination: `/list/${listID}`,
      permanent: false,
    },
  };
};

export default Page;
