import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F4EC]">
      <SignUp
        appearance={{
          variables: {
            colorPrimary: "#0F3D2E",
            colorBackground: "#F8F4EC",
            borderRadius: "0.5rem",
          },
        }}
        afterSignUpUrl="/app"
        signInUrl="/sign-in"
      />
    </div>
  );
}
