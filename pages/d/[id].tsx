import { GetServerSideProps } from "next";

import App from "../../src/app";

import { spaceExists } from "../../replicache-nextjs/api";
import { useReplicache } from "../../replicache-nextjs/frontend/use-replicache";
import { mutators } from "../../src/mutators";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const [, , spaceID] = context.resolvedUrl.split("/");
  if (spaceID === undefined) {
    throw new Error("Missing spaceID path component");
  }

  // Ensure the selected space exists. If it doesn't pick a new one. It's common
  // during development for developers to delete the backend database. As a
  // convenience, we automatically pick a new one when this occurs by
  // redirecting back to the root.
  if (!(await spaceExists(spaceID))) {
    return {
      redirect: {
        destination: `/`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      spaceID,
    },
  };
};

export default function Home({ spaceID }: { spaceID: string }) {
  // Load Replicache
  const rep = useReplicache(spaceID, mutators);
  if (!rep) {
    return null;
  }

  return (
    <div className="todoapp">
      <App rep={rep} />
    </div>
  );
}
