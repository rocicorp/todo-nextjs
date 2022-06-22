import { useEffect, useState } from "react";
import { GetServerSideProps } from "next";

import App from "../../frontend/app";

import { Replicache } from "replicache";
import { M, mutators } from "../../frontend/mutators";
import { transact } from "../../backend/pg";
import { getCookie } from "../../backend/data";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const [, , spaceID] = context.resolvedUrl.split("/");
  if (spaceID === undefined) {
    throw new Error("Missing spaceID path component");
  }

  // Ensure the selected space exists. If it doesn't pick a new one. It's common
  // during development for developers to delete the backend database. As a
  // convenience, we automatically pick a new one when this occurs by
  // redirecting back to the root.
  const cookie = await transact(async (executor) => {
    return await getCookie(executor, spaceID);
  });

  if (cookie === undefined) {
    return {
      redirect: {
        destination: `/`,
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default function Home() {
  const [rep, setRep] = useState<Replicache<M> | null>(null);

  // Currently Replicache is only supported on the client-side. The useEffect()
  // here is a common hack to prevent next from running the code server-side.
  useEffect(() => {
    (async () => {
      if (rep) {
        return;
      }

      // Construct our Replicache instance, registering our mutators which will
      // be used to make changes to our data.
      const [, , spaceID] = location.pathname.split("/");
      const r = new Replicache({
        // See https://doc.replicache.dev/licensing for how to get a license key.
        licenseKey: process.env.NEXT_PUBLIC_REPLICACHE_LICENSE_KEY!,
        pushURL: `/api/replicache-push?spaceID=${spaceID}`,
        pullURL: `/api/replicache-pull?spaceID=${spaceID}`,
        name: spaceID,
        mutators,
      });

      // Replicache uses an empty "poke" message sent over pubsub to know when
      // to get changes from the server. This demo app uses server-sent events to
      // send pokes but there are lots of ways to do it.
      // See: https://doc.replicache.dev/how-it-works#poke-optional.
      const ev = new EventSource(`/api/replicache-poke?spaceID=${spaceID}`, {
        withCredentials: true,
      });
      ev.onmessage = (event) => {
        if (event.data === "poke") {
          r.pull();
        }
      };

      setRep(r);
    })();
  }, []);

  if (!rep) {
    return null;
  }

  return (
    <div className="todoapp">
      <App rep={rep} />
    </div>
  );
}
