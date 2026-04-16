import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => {
      if (process.env.NEXT_PUBLIC_VAGABOND_DEV_AUTH === "true") {
        return true;
      }
      return !!token;
    },
  },
});

export const config = {
  matcher: ["/trips/:path*", "/rig/:path*"],
};
