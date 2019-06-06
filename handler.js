'use strict';

const AWS = require('aws-sdk');

const db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
const uuid = require('uuid/v4');
const postsTable = process.env.POSTS_TABLE;

// Create a response
function response(statusCode, message) {
  'use strict';
  return {
    statusCode: statusCode,
    body: JSON.stringify(message)
  };
}
function sortByDate(a, b) {
  'use strict';
  if (a.createdAt > b.createdAt) {
    return -1;
  } else return 1;
}

// Create a post
module.exports.createPost = (event, context, callback) => {
  // console.log("Test value IN #12d: ", reqBody.payload);
  event.body.payload = event.body.payload.Replace(/^"|"$/g, '');
  console.log("Test value IN #aaa: ", event.body);
  const reqBody = JSON.parse(event.body);

  console.log("Test value IN #12C: ", reqBody.payload);
  // const reqBody = JSON.parse(event.body);
  // const reqBody = JSON.parse(event.body);
  // reqBody.payload = reqBody.payload.replace(/"/g, "\\\"");
  // reqBody.payload = reqBody.payload.replace(/["']/g, "");
  console.log("Test value IN #12B: ", reqBody.payload);
  reqBody.payload = reqBody.payload.replace(/^"|"$/g, '');
  console.log("Test value IN #12A: ", reqBody.payload);

  if (
    !reqBody.payload ||
    reqBody.payload.trim() === '' ||
    !reqBody.serialNum ||
    reqBody.serialNum.trim() === ''
  ) {
    return callback(
      null,
      response(400, {
        error: 'Post must have a request payload, body and SerialNum they must not be empty'
      })
    );
  }


  console.log("Test value IN #1: ",reqBody.payload);
//  reqBody.payload.replace(/"/g, "\\\"");
  const post = {
    id: uuid(),
    createdAt: new Date().toISOString(),
    SerialNum: reqBody.serialNum,
    payload: reqBody.payload
  };
  console.log("Test value IN #2: ", reqBody.payload);

  return db
    .put({
      TableName: postsTable,
      Item: post
    })
    .promise()
    .then(() => {
      callback(null, response(201, post));
    })
    .catch((err) => response(null, response(err.statusCode, err)));
};
// Get all posts
module.exports.getAllPosts = (event, context, callback) => {
  return db
    .scan({
      TableName: postsTable
    })
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items.sort(sortByDate)));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// Get number of posts
module.exports.getPosts = (event, context, callback) => {
  const numberOfPosts = event.pathParameters.number;
  const params = {
    TableName: postsTable,
    Limit: numberOfPosts
  };
  return db
    .scan(params)
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items.sort(sortByDate)));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// Get a single post
module.exports.getPost = (event, context, callback) => {
  const id = event.pathParameters.id;

  const params = {
    Key: {
      id: id
    },
    TableName: postsTable
  };

  return db
    .get(params)
    .promise()
    .then((res) => {
      if (res.Item) callback(null, response(200, res.Item));
      else callback(null, response(404, { error: 'Post not found' }));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// Update a post
module.exports.updatePost = (event, context, callback) => {
  const id = event.pathParameters.id;
  const reqBody = JSON.parse(event.body);
  const { body, payload } = reqBody;

  const params = {
    Key: {
      id: id
    },
    TableName: postsTable,
    ConditionExpression: 'attribute_exists(id)',
    UpdateExpression: 'SET payload = :payload, body = :body',
    ExpressionAttributeValues: {
      ':payload': payload,
      ':body': body
    },
    ReturnValues: 'ALL_NEW'
  };
  console.log('Updating');

  return db
    .update(params)
    .promise()
    .then((res) => {
      console.log(res);
      callback(null, response(200, res.Attributes));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// Delete a post
module.exports.deletePost = (event, context, callback) => {
  const id = event.pathParameters.id;
  const params = {
    Key: {
      id: id
    },
    TableName: postsTable
  };
  return db
    .delete(params)
    .promise()
    .then(() =>
      callback(null, response(200, { message: 'Post deleted successfully' }))
    )
    .catch((err) => callback(null, response(err.statusCode, err)));
};
