// Import necessary modules and packages
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/user/User"; // Import the User model from the specified path
import { connectUserDB } from "@/utils/db"; // Import the connectUserDB function from the specified path
import bcrypt from "bcryptjs"; // Import the bcrypt library for password hashing
import { getIdWithName, getUserWithName } from '@/utils/routeMethods.js'


// Define a NextAuth handler for authentication
const handler = NextAuth({
  // Configure authentication providers
  providers: [
    // Use CredentialsProvider for custom credentials-based authentication
    CredentialsProvider({
      id: "credentials", // Unique identifier for this provider
      name: "Credentials", // Display name for this provider
      async authorize(credentials) {
        // Check if the user exists in the database
        await connectUserDB(); // connectUserDB to the database using the utility function

        try {
          // Find the user in the database by email
          let user = await User.findOne({
            email: credentials.email,
          });
          console.log(user)

          if (user) {
            // If the user exists, check if the provided password is correct
            const isPasswordCorrect = await bcrypt.compare(
              credentials.password,
              user.password
            );

            if (isPasswordCorrect) {
              // If the password is correct, return the user
              user = await User.findOne({
                email: credentials.email,
              })
              // await getIdWithName(user.username)

              return user
            } else {
              // If the password is incorrect, throw an error
              throw new Error("Wrong Credentials!");
            }
          } else {
            // If the user is not found, throw an error
            throw new Error("User not found!");
          }
        } catch (err) {
          // Handle any errors that occur during the authorization process
          throw new Error(err);
        }
      },
    }),
    // Use GithubProvider for GitHub OAuth authentication
    GithubProvider({
      clientId: process.env.GitHub_ID,
      clientSecret: process.env.GitHub_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_URL,
  // Customize error page redirection
  pages: {
    error: "/dashboard/login",
  },
  /* callbacks: {
    session: async (session, user) => {
      // Check if user is defined before accessing its properties
      if (user && user._id) {
        // Attach the MongoDB user._id to the session
        session.user._id = user._id; // Assuming user._id is the MongoDB _id
      }
      return Promise.resolve(session);
    },
  }, */
});

// Export the NextAuth handler for both GET and POST requests
export { handler as GET, handler as POST };
