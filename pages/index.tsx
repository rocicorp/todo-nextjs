import { nanoid } from "nanoid";
import { GetServerSideProps } from "next";
import { createSpace } from "../replicache-nextjs/api";

function Page() {
  return "";
}

// This is the entrypoint for the application. We randomly select a new "space"
// to store todos in and create it server-side, then redirect the user to
// /d/<spaceid>, which actually loads the app.
//
// Spaces are not part of the Replicache protocol officially, but they are a
// common pattern for Replicache apps. Because server-side data a user has
// access to is often larger than would make sense to sync all at once, an easy
// approach in many applications is to partition the data into "spaces". Each
// space becomes one Replicache "cache" that is synced in its entirety when
// used. When the user moves around within the space, the ux is instant, and the
// only progress bar is potentially when crossing spaces.
//
// In a real todo application, there'd likely only be need for one space, since
// a user is not going to ever have enough todos to have to partition at all.
// But in a sophisticated project management application, each project would
// likely be one space.
//
// All our demo apps use spaces for a different reason: each navigation to the
// demo app gets its own space so that different demoers aren't confused by
// seeing other demoers making changes.
export const getServerSideProps: GetServerSideProps = async () => {
  // Create a new random space in the backend database.
  const spaceID = nanoid(6);
  await createSpace(spaceID);
  return {
    redirect: {
      destination: `/d/${spaceID}`,
      permanent: false,
    },
  };
};

export default Page;
