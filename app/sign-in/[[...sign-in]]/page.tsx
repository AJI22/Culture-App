/**
 * Clerk sign-in page (route: /sign-in). Redirects to /app after successful sign-in (see docs/CLERK_SETUP.md).
 * Styled to match design system (primary green, ivory background).
 */
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F4EC]">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#0F3D2E",
            colorBackground: "#F8F4EC",
            borderRadius: "0.5rem",
          },
        }}
        afterSignInUrl="/app"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
