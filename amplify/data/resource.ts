import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { RSCPathnameNormalizer } from "next/dist/server/future/normalizers/request/rsc";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Problem: a
    .model({
      content: a.string(),
      publishDate: a.date(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      topics: a.hasMany('ProblemTopic', 'problemID'),
      note: a.hasOne('Note', 'problemID'),
      bookmark: a.hasOne('Bookmark', 'problemID'),
      rating: a.hasOne('Rating', 'problemID'),
      hint: a.string(),
      tags: a.string().array(),
      wSolution: a.string(),
      vSolution: a.string()
    })
    .authorization(allow => [
      allow.authenticated().to(['read']),
      allow.group('admin')
    ]),

  ProblemTopic: a
    .model({
      problemID: a.id().required(),
      topicID: a.id().required(),
      problem: a.belongsTo('Problem', 'problemID'),
      topic: a.belongsTo('Topic', 'topicID'),
    }).authorization(allow => [
      allow.authenticated().to(['read']),
      allow.group('admin')
    ]),
    

  Topic: a
    .model({
      name: a.string(),
      description: a.string(),
      courseID: a.id(),
      course: a.belongsTo('Course', 'courseID'),
      problems: a.hasMany('ProblemTopic', 'topicID'),
    })
    .authorization(allow => [
      allow.authenticated().to(['read']),
      allow.group('admin')
    ]),

  Note: a
    .model({
      content: a.string(),
      problemID: a.id(),
      problem: a.belongsTo('Problem', 'problemID'),
      owner: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization(allow => [
      allow.owner()
    ]),

  Course: a
    .model({
      name: a.string(),
      description: a.string(),
      topics: a.hasMany('Topic', 'courseID'),
    })
    .authorization(allow => [
      allow.authenticated().to(['read']),
      allow.group('admin')
    ]),

  Bookmark: a
    .model({
      date: a.date(),
      owner: a.string(),
      problemID: a.id(),
      problem: a.belongsTo('Problem', 'problemID'),
    })
    .authorization(allow => [
      allow.owner()
    ]),

  Rating: a
    .model({
      date: a.datetime(),
      rating: a.enum(['easy', 'medium', 'hard']),
      owner: a.string(),
      problemID: a.id(),
      problem: a.belongsTo('Problem', 'problemID'),
    })
    .authorization(allow => [
      allow.owner()
    ])
});


export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    /*apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },*/
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>