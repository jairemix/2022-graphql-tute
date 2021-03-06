// This file describes the Schema for GraphQL

const graphql = require('graphql');

const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
} = graphql;

const Book = require('../models/book');
const Author = require('../models/author');

const BookType = new GraphQLObjectType({
  name: 'Book',
  fields: () => ({ // it should wrapped in a function so that we can use AuthorType (which has not yet been defined)
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    genre: { type: GraphQLString },
    author: {
      type: AuthorType,
      // here the resolve function gets the Author object corresponding to the parent book
      resolve (parent, args) {
        const { authorId } = parent; // parent is the book returned
        console.log('[server/app] getting related author', authorId);
        return Author.findById(authorId);
      },
    },
  }),
});

const AuthorType = new GraphQLObjectType({
  name: 'Author',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    age: { type: GraphQLInt },
    books: {
      type: new GraphQLList(BookType),
      // here the resolve function gets Book objects corresponding to the parent author
      resolve (parent, args) {
        const { id } = parent; // parent is the author returned
        console.log('[server/app] getting related books', id);
        return Book.find({ authorId: id });
      },
    },
  }),
});

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {

    book: {
      type: BookType,
      args: {
        id: { type: GraphQLID }, // we need to pass an ID as argument so that we know which book it is
      },
      resolve (parent, args) {
        // here we implement code to get data from DB or other source
        const { id } = args; // we can get id from args since this has been defined above
        console.log('[server/app] getting book', id);
        return Book.findById(id);
      },
    },

    author: {
      type: AuthorType,
      args: {
        id: { type: GraphQLID },
      },
      resolve (parent, args) {
        const { id } = args;
        console.log('[server/app] getting author', id);
        return Author.findById(id);
      },
    },

    books: {
      type: new GraphQLList(BookType),
      resolve: (parent, args) => {
        console.log('[server/app] getting all books');
        return Book.find({}); // return all books
      },
    },

    authors: {
      type: new GraphQLList(AuthorType),
      resolve: (parent, args) => {
        console.log('[server/app] getting all authors');
        return Author.find({}); // return all authors
      },
    },

  },
});

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {

    /**
     * addAuthor operation creates a new object of type Author, accepting arguments of name and age
     */
    addAuthor: {
      type: AuthorType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: GraphQLInt, defaultValue: null },
      },
      async resolve (parent, args) {
        console.log('[server/app] adding author', args);
        const author = new Author({
          name: args.name,
          age: args.age,
        });
        const result = await author.save(); // returns Promise that resolves new Author object
        console.log('[server/app] added author', result);
        return result;
      }
    },

    /**
     * addAuthor operation creates a new object of type Author, accepting arguments of name and age
     */
    addBook: {
      type: BookType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        genre: { type: GraphQLString, defaultValue: null },
        authorId: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args) => {
        console.log('[server/app] adding book', args);
        const book = new Book({
          name: args.name,
          genre: args.genre,
          authorId: args.authorId,
        });
        const result = await book.save();
        console.log('[server/app] added book', result);
        return result;
      }
    },

  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
});
