import gql from 'graphql-tag';

export default gql`
  # Payload for contact Mutation

  extend type Mutation {
    # Send contact us info
    contact(input: ContactInput!): String
  }

  # Input for addPost Mutation
  input ContactInput {
    name: String!
    email: String!
    content: String!
  }
`;
