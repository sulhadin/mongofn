# Mongofn

A practical functional programming library to use some of the key features that [mongodb](https://www.npmjs.com/package/mongodb) 
provide. 

Focus of the library is definitely not to provide all features that `mongodb` provides.
Instead, Mongofn will provide you the most common functions wrapped with curried functions, 
so that you can skip initial setup for `client` and retrieval of `db` and `collection` objects,
and make them extremely reusable across your entire project.

Note: Mongofn is completely dependent on [ramda](https://github.com/ramda/ramda) library to
provide functional programming style for mongodb.

## Why Mongofn?

It is simple and extensible with the power of functional programming paradigm.
Since the most of the functions provided are curried functions, 
you can benefit from it by recomposing your implementations with different combinations of
arguments of functions as much as you need.

See [this](https://fr.umio.us/favoring-curry/) for more info about currying.

## What is the difference?

Performing simple read operation using original `mongodb` connector:

```js
// simple usage from official MongoDb Docs

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'myproject';

// Create a new MongoClient
const client = new MongoClient(url);

// Use connect method to connect to the Server
client.connect(function(err) {
  assert.equal(null, err);
  console.log("Connected successfully to server");

  const db = client.db(dbName);

  client.close();
});
```

To be able to reuse this code snippet you may be storing the client instance
somewhere and reach it from other place in your project, but it is still done
imperatively. 

Here is a collection usage in Mongofn:

```js
const { useCollection } = require('mongofn');

// Connection URL
const connectionString = 'mongodb://localhost:27017';

const useMainDb = useCollection(connectionString, 'mainDb');

const categoriesCol = useMainDb('collections')
    .then(collection => collection.find({}).toArray());
const articlesCol = useMainDb('articles')
    .then(collection => collection.find({}).toArray());
```

It is simpler and reusable. When you pass url as first argument to `useCollection` function,
it caches the `client` and reuse it every time you call the function. You can recompose
this kind of functions and export them as util functions from somewhere and use whenever 
you need without any additional setup.

## Installation


```sh
# Using npm
npm install --save mongofn

# Using yarn
yarn add mongofn
```

## Usage

Mongofn essentially provides you some useful functions to connect a MongoDB client,
and perform most used operations on a MongoDB instance including CRUD operations. 

Also, Mongofn provides `useDb` and `useCollection` functions
that simply give you original `Db` and `Collection` objects from `mongodb`,
then you can freely perform all kinds of `mongodb` operations.

### Connecting a MongoDB instance

Before you can perform operations on a MongoDB instance, first we need to connect to it.
To connect a MongoDB instance you can use `createClient` function.

```js
const { createClient } = require('mongofn');

const connectionString = 'mongodb://root:rootpassword@localhost:27017';
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Connect to given MongoDB instance and return a Promise<MongoClient>
// which you can do any configuration mongodb provides
createClient(connectionString, options).then(client => {
  const db = client.db('dbName');
  const collection = db.collection('collectionName');

  return collection.find({}).toArray();
}).then(console.log);

```

#### Memoization
`createClient` is a memoized function, so it will return the same instance
if you call it with the same arguments.

For more info: see [memoizeWith](https://ramdajs.com/docs/#memoizeWith) 
and [Memoization (1D, 2D and 3D)](https://www.geeksforgeeks.org/memoization-1d-2d-and-3d/)

All other main functions of Mongofn requires `client`.

### Closing connection
It is highly recommended that you should keep your connection open since
it might spend just a little more time to restart the connection when you
try to perform an operation on a `MongoClient`. That is why any of provided
functions of Mongofn does not close the connection after any operation is done.
However, there might be cases you need to close the client session, e.g. on exiting
of you app, in that case, you can use `closeConnection` function which accepts
the same arguments with `createClient`, to close the given connection. If you have
client instance already, of course you can simply all `client.close()` as well.

Here is the usage of `closeCollection` function:

```js
const { createClient, closeClient } = require('mongofn');
 
const connectionString = '....';
const options = {};

const client = createClient(connectionString, options);
findBy(client, 'databaseName', 'collectionName', {name: 'some name'})
 .then(console.log);

// Closing the client session giving the same parameters we passed
// to createClient function above.
closeClient(connectionString, options);
``` 

Since `createClient` is a `memoized` function, `closeClient` calls `createClient`
inside to fetch the same `MongoClient` instance using memoization, then closes
the connection.

### useDb and useCollection

In `mongodb`, we start with connection client and pass a callback function to perform
operations over connected `mongodb` instance. It is repeated and very imperative way of
using mongodb. In Mongofn, you can use `useDb` and `useCollection` functions which
accepts `client` as first argument to use with, to perform all kinds of `Db` and `Collection` 
in declarative way.

```js
// useMainDb.js
const { useDb } = require('mongofn');

const connectionString = 'mongodb://localhost:27017';

export const useMainDb = () => useDb(connectionString, 'mainDb');

// someOther.js
const { useMainDb } = require('./useMainDb');

useMainDb().then(console.log); // Original Db object of mongodb

```

Ok, I can hear you saying "Where is the functional programming?". 

Functional programming actually starts with `useCollection`. 
However, before we dive into functional programming realm, let's first understand
the basic usage of the function.

Here is an example of fetching all data that a collection contains.

```js
const { useCollection } = require('mongofn');

const connectionString = 'mongodb://localhost:27017';

useCollection(connectionString, 'mainDb', 'someCollection')
    .then(collection => {
            return collection.find({}).toArray(); // retrieve all
        }
    )
    .then(console.log);
```

Since it uses original `Collection` object of `mongodb`, you can simply
do anything you want that `mongodb` provides.

If we want to make it reusable across our entire app we can benefit from
currying.

As we noted before, most of the functions are curried in Mongofn.

Let's make an example and compose a function which will help you use collections
in a db without repeating code for the setup.

```js
const { useCollection } = require('mongofn');

const connectionString = 'mongodb://localhost:27017';

// Here we do not pass the last argument so that it will return another
// function which accepts only collectionName argument
const useCollectionInMainDb = useCollection(connectionString, 'mainDb');

useCollectionInMainDb('categories').then(console.log);
useCollectionInMainDb('articles').then(console.log);
useCollectionInMainDb('users').then(console.log);
```

### __ object

Before we give you more info about CRUD operations in Mongofn, we need to understand
one crucial object `__`. It is a special placeholder which you can use in curried functions
to be able to recompose your function allowing partial application of any combination
 of arguments, regardless of their positions.
 
```js
const { useCollection } = require('mongofn');

const connectionString = 'mongodb://localhost:27017';

const useCategoriesIn = useCollection(connectionString, __, 'categories');

useCategoriesIn('mainDb').then(console.log);
useCategoriesIn('otherDb').then(console.log);
```

As you may have noticed, after passing `__` object to useCollection as `dbName` argument,
`useCollection` returns another function which you can pass any `dbName` you need, so you
reuse the rest of the setup of the function. This is useful in mostly CRUD operations since
they await more parameters from you to perform certain operations.

### Using findBy, findAll, findById, and findByObjectId

`useDb` and `useCollection` functions provide full capability of
using original `Db` and `Collection` objects in `mongodb` in functional way.
However, we tend to use `mongodb` for mostly CRUD operations.

Mongofn provide following functions for finding operations:
- `findBy(client, dbName, collectionName, predicate) : Promise<Array>`
    - Accepts predicate object as it is documented at 
    [here](http://mongodb.github.io/node-mongodb-native/3.5/reference/ecmascriptnext/crud/#read-methods)
    and returns a `Promise<Array>`.
- `findAll(client, dbName, collectionName) : Promise<Array>`
    - Does not need any additional specific argument. 
    It simply returns all data in given collection as `Promise<Array>`
- `findById(client, dbName, collectionName, id) : Promise<object>`
    - Accepts `id` value to look for the `Document` with given `id` in given
    collection, and return `Promise<object>`.
- `findByObjectId(client, dbName, collectionName, id) : Promise<object>`
    - It's a wrapper function of `findById` to rescue you from repeatedly pass
    your id value in an instance of `ObjectId`.

Note: `find` operations also accept `Array` as the last argument in which
the first element is the `query param`, and the second element is the
`options` to be passed to the corresponding `mongodb` operation.
  
All the CRUD operations functions are curried, so you can freely use them as we
used `useDb` and `useCollection` functions.

Here are some examples of usage.

```js
// findBy example
const { createClient, findBy, __ } = require('mongofn');

const connectionString = 'mongodb://localhost:27017';

const findInMaindDbBy = findBy(connectionString, 'mainDb');

findInMaindDbBy('categories', { name: 'some Categery' }).then(console.log);
// You can pass options as well if you prefer passing an array
findInMaindDbBy(
  'articles', [
    { name: 'some Article' },
    { projection: { _id: 0, name: 1 }}
  ]).then(console.log); // projected result

const findInCategoriesBy = findInMaindDbBy('categories');
findInCategoriesBy({ name: 'some Categery' }).then(console.log);
findInCategoriesBy({ description: 'some Categery description' }).then(console.log);

// Say we have multiple replica client
const client1 = createClient(connectionString, options);
const client2 = createClient(connectionString, options);

const findInMainDbUsing = findBy(__, 'mainDb');
const findInCategoriesUsing = (__, 'categories');

findInCategoriesUsing(client1, { name: 'some Categery' }).then(console.log);
findInCategoriesUsing(client2, { name: 'some Categery' }).then(console.log);

findInMainDbUsing(client1, 'users', { name: 'some User name' }).then(console.log);
findInMainDbUsing(client2, 'users', { name: 'some User name' }).then(console.log);

// You can think of all combinations you need. 
```

## TODO

- Discard memoization from `createClient` and introduce `useMemoClient` instead. 
- Implement insertOne
- Implement updateOne
- Tests
