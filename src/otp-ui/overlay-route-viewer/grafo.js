const A = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const B = [1, 2, 3, 4, 5, "A", "B", "C", 8, 9, 10];
const C = [1, 2, "F", "G", "H", "I", 5, 6, 7, 8, 9, 10];

class Vertex {
  #weight;
  #vertex;
  #adjacentVertices;
  constructor(vertex) {
    this.#weight = 1;
    this.#vertex = vertex;
    this.#adjacentVertices = new Set();
    console.log("constructor");
    this.print();
  }

  increaseWeight(weight = 1) {
    this.#weight += weight;
    console.log("increase weight");
    this.print();
  }

  addAdjacentVertices(vertex) {
    this.#adjacentVertices.add(vertex);
    console.log("add adj vertices");
    this.print();
  }

  get adjacentVertices() {
    return Array.from(this.#adjacentVertices);
    console.log("get adj vertices");
    this.print();
  }

  get vertex() {
    return {
      weight: this.#weight,
      vertex: this.#vertex,
    };
  }

  print() {
    console.log("vertex", this.vertex, "adj", this.adjacentVertices);
  }
}

class Graph {
  #graph = new Map();

  get vertices() {
    return Array.from(this.#graph.values()).map((vertex) => vertex.vertex);
  }

  getVertex(vertex) {
    if (this.#graph.has(vertex)) {
      return this.#graph.get(vertex).vertex;
    }
  }

  getAdjacentList(vertex) {
    if (this.#graph.has(vertex)) {
      return this.#graph.get(vertex).adjacentVertices;
    }
    return [];
  }

  addVertex(vertex, isArrival) {
    if (this.#graph.has(vertex)) {
      if (isArrival) {
        // we add each node twice
        // one time as starting vertex
        // one time as ending vertex
        // so this is needed to avoid double weight
        this.#graph.get(vertex).increaseWeight();
      }
    } else {
      this.#graph.set(vertex, new Vertex(vertex));
    }
  }

  addEdge(vertex1, vertex2 /* , directed = true */) {
    if (vertex1 && vertex2 && vertex1 != vertex2) {
      this.addVertex(vertex1, false);
      this.addVertex(vertex2, true);
      this.#graph.get(vertex1).addAdjacentVertices(vertex2);
    }
  }

  print() {
    console.log("....");
    Array.from(this.#graph.values()).forEach((vertex) => vertex.print());
    console.log("....");
  }
}

/* const dfs = (graph, vertex) => {
  const visitSequence = [];
  const stack = [];
  const visited = new Set();
  stack.push(vertex);

  while (stack.length !== 0) {
    const vertex = stack.pop();
    if (!visited.has(vertex)) {
      visitSequence.push(vertex);
      visited.add(vertex);
      console.log(graph.getAdjacentList(vertex));
      graph
        .getAdjacentList(vertex)
        .forEach((adjVertex) => stack.push(adjVertex));
    }
  }

  return visitSequence;
}; */

/* const dfs2 = (graph, vertex) => {
  const visitSequence = [[]];
  const stack = [];
  const visited = new Set();

  stack.push({ vertex, visitIndex: 0, parent: undefined });

  while (stack.length !== 0) {
    let { vertex, visitIndex, parent } = stack.pop();
    if (!visited.has(vertex)) {
      const u = graph.getVertex(vertex);
      if (parent && parent.weight !== u.weight) {
        visitIndex++;
      }
      if (!Array.isArray(visitSequence[visitIndex])) {
        visitSequence[visitIndex] = [];
        visitSequence[visitIndex].push(parent.vertex);
      }

      //   console.log(visitSequence);
      visitSequence[visitIndex].push(vertex);
      visited.add(vertex);
      //   console.log(graph.getAdjacentList(vertex));
      const adj = graph.getAdjacentList(vertex);

      adj.forEach((adjVertex, index) =>
        stack.push({
          vertex: adjVertex,
          visitIndex: visitIndex + index,
          parent: u,
        })
      );
    } else {
      visitSequence[visitIndex].push(vertex);
    }
  }

  return visitSequence;
}; */

/* const bfs = (graph, vertex) => {
  const visitSequence = [];
  const queue = [];
  const visited = new Set();
  queue.push(vertex);

  while (queue.length !== 0) {
    const vertex = queue.shift();
    graph.getAdjacentList(vertex).forEach((adjVertex) => {
      if (!visited.has(vertex)) {
        visitSequence.push(vertex);
        visited.add(vertex);
        console.log(graph.getAdjacentList(vertex));
        queue.push(adjVertex);
      }
    });
  }

  return visitSequence;
}; */

const createSequences = (graph, vertex) => {
  // initialization
  const visitSequence = [[]]; // sequence of connected nodes
  const stack = [];
  const visited = new Set();

  // pathIndex is the sequence number
  stack.push({ vertex, pathIndex: 0, parent: undefined });

  while (stack.length !== 0) {
    let { vertex, pathIndex, parent } = stack.pop();

    if (!visited.has(vertex)) {
      // if not already visited

      const u = graph.getVertex(vertex);

      if (parent && parent.weight !== u.weight) {
        pathIndex++;
      }
      if (!Array.isArray(visitSequence[pathIndex])) {
        // initialize array if missing
        visitSequence[pathIndex] = [];
        // add parent as first element so whe know ho to reach this sequence
        visitSequence[pathIndex].push(parent.vertex);
      }

      visited.add(vertex); // mark as visited
      visitSequence[pathIndex].push(vertex); // add to sequence

      const adjacentVertices = graph.getAdjacentList(vertex);
      adjacentVertices.forEach((adjVertex, index) =>
        stack.push({
          vertex: adjVertex,
          pathIndex: pathIndex + index,
          parent: u,
        })
      );
    } else {
      visitSequence[pathIndex].push(vertex);
    }
  }

  return visitSequence;
};

/* const graph = new Graph();

for (i = 0; i < A.length - 1; i++) {
  graph.addEdge(A[i], A[i + 1]);
}
for (i = 0; i < B.length - 1; i++) {
  graph.addEdge(B[i], B[i + 1]);
}
for (i = 0; i < C.length - 1; i++) {
  graph.addEdge(C[i], C[i + 1]);
}
console.log("0000");
graph.print();

console.log("0000");
console.log(dfs2(graph, 1));
 */

export { Graph, createSequences };
