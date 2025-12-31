export const nextAuthFile = `import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"

export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
  ],
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
`;

export const nextAuthApiRoute = `export { GET, POST } from "@/lib/auth"
`;

export const nextAuthMiddleware = `import { auth } from "@/lib/auth"
 
export default auth((req) => {
  // req.auth
})
 
// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
`;

export const clerkMiddleware = `import { authMiddleware } from "@clerk/nextjs";
 
// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
export default authMiddleware({});
 
export const config = {
  matcher: ['/((?!.+\\\\.[\\\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
`;

export const nextAuthEnv = `
# NextAuth.js
# Generate a random secret with: openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"

# GitHub Provider
GITHUB_ID=""
GITHUB_SECRET=""
`;

export const clerkEnv = `
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
`;

export const nextAuthPage = `import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Authentication Example</h1>
      
      <div className="w-full max-w-md p-8 rounded-lg border shadow-sm">
        {session ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 mb-6">
              {session.user?.image && (
                <img 
                  src={session.user.image} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">{session.user?.name}</p>
                <p className="text-sm text-gray-500">{session.user?.email}</p>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 text-green-700 rounded-md mb-4 border border-green-200">
              ✅ You are currently signed in!
            </div>

            <a
              href="/api/auth/signout"
              className="block w-full text-center py-2 px-4 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Sign Out
            </a>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <p className="text-gray-600">
              You are currently signed out. Sign in to access your dashboard.
            </p>
            
            <a
              href="/api/auth/signin?callbackUrl=/"
              className="block w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign In with GitHub
            </a>
            
            <p className="text-xs text-gray-400 mt-4">
              Note: Configure GITHUB_ID and GITHUB_SECRET in .env first
            </p>

            <div className="mt-8 p-4 bg-gray-50 rounded-md text-left text-sm border border-gray-200">
              <p className="font-semibold mb-2">GitHub OAuth Setup:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Go to <a href="https://github.com/settings/developers" target="_blank" className="text-blue-600 hover:underline">GitHub Developer Settings</a></li>
                <li>Create a new OAuth App</li>
                <li><strong>Homepage URL:</strong> http://localhost:3000</li>
                <li><strong>Callback URL:</strong> http://localhost:3000/api/auth/callback/github</li>
                <li>Copy Client ID & Secret to .env</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
`;

export const clerkAuthPage = `import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function AuthPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Clerk Authentication</h1>
      
      <div className="w-full max-w-md p-8 rounded-lg border shadow-sm text-center">
        <SignedIn>
          <div className="flex flex-col items-center space-y-4">
            <UserButton afterSignOutUrl="/" />
            <p className="font-medium text-lg">Welcome back!</p>
            <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200 w-full">
              ✅ You are signed in
            </div>
          </div>
        </SignedIn>
        
        <SignedOut>
          <div className="space-y-6">
            <p className="text-gray-600">
              Sign in to manage your account and access features.
            </p>
            <SignInButton mode="modal">
              <button className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Sign In
              </button>
            </SignInButton>
          </div>
        </SignedOut>
      </div>
    </div>
  );
}
`;
