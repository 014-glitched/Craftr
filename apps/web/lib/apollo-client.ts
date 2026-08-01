import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function makeApolloClient() {
  return new ApolloClient({
    link: new HttpLink({
      uri: `${apiUrl}/graphql`,
      credentials: "include",
    }),
    cache: new InMemoryCache(),
  });
}

let client: ApolloClient | null = null;

export function getApolloClient() {
  if (!client) {
    client = makeApolloClient();
  }
  return client;
}
