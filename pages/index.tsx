import { nanoid } from "nanoid";
import { GetServerSideProps } from "next";

function Page() {
  return "";
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  let r = context.req.cookies["room"];
  if (!r) {
    r = nanoid(6);
    context.res.setHeader("set-cookie", `room=${r}`);
  }
  return {
    redirect: {
      destination: `/d/${r}`,
      permanent: false,
    },
  };
};

export default Page;
