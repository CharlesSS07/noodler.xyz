# The Following are Server-Side Functions for Noodler

use whatever database system seems most appropriate for this task

## Node Blueprints Manipulation API

blueprints for nodes represent what the node does computationally, and it's function signature. they are created in development mode, then when the creators are happy they deploy (and therefore freeze) them, so they cannot be played with any more. if anyone wants to update the blueprint, they must fork it, make their changes, and redeploy.

 * get (node id) --> data
 * fork (node id, auth) --> node id
   * this makes a copy of a deployed blueprint so it can be modified and then redeployed in a version update
   * anonymous users cannot fork blueprints, they must create an account or log in
 * create (auth) --> node id
   * this makes a new, empty, node which is in development mode
   * anonymous users cannot create a node officially, it must be contained on client side
 * update spec (node id, auth, new spec, new code)
   * updates the function and signature in the database
   * can be updated by any non-anonymous user
 * update docs (node id, auth, title, docs)
   * updates the docs for the node on a node-wide level, so all nodes share the same title and docs
   * can be updated by any non-anonymous user
 * deploy (node id, auth)
   * can only be deployed by the user that created the node
   * moves the node to a database/collection which is readonly for all users so it won't be written to

## Node Blueprint Search API

node blueprints are stored as {node id}={node key}/{author id}/{created_at second} so there are lots of version for one node_key, but all node_keys have one title and documentation.

 * title or docs contains (substring, auth) --> node id iterable stream
   * only non-anonymous users can search
 * query (query, auth, [llm augment, project]) --> node id iterable stream
   * uses vector db to find nearest neighbors and returns their node id's
   * llm augment means to use an LLM to augment the search terms after parsing the project for extra context (a stretch feature, don't implement yet)
 * get reccommended version (node key) --> node id
   * returns the latest deployed node id with this node key. might also
