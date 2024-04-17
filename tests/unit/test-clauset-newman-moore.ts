import assert from "assert";

import { DecayingMaxHeap } from "../../src/clustering/decaying-max-heap";
import { OGraph } from "osigma";
import greedy_modularity_communities from "../../src/clustering/clauset-newman-moore";

type TId = Int32Array;
type TConnectionWeight = Uint8Array;
type TCoordinates = Float32Array;
type TZIndex = Uint8Array;
type TNodeFeatures = [Int8Array];
type TConnectionFeatures = [];

describe("Clauset-Newman-Moore greedy_modularity_communities tests", () => {
    it("should not create communities of a disconnected graph", () => {
        const graph = new OGraph<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >(
            {
                features: [new Int8Array([0, 1, 2, 3, 4])],
                xCoordinates: new Float32Array(5),
                yCoordinates: new Float32Array(5),
                zIndex: new Uint8Array(5),
            },
            {
                from: new Int32Array(0),
                to: new Int32Array(0),
                value: new Uint8Array(0),
                zIndex: new Uint8Array(0),
                features: [],
            }
        );

        const target = [[0], [1], [2], [3], [4]];

        const communities = greedy_modularity_communities(graph, (c) => new Int32Array(c));

        assert.deepEqual(communities, target);

    });
    it("should create a single comminuty of a graph with one link", () => {
        const graph = new OGraph<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >(
            {
                features: [new Int8Array([0, 1, 2, 3, 4])],
                xCoordinates: new Float32Array(5),
                yCoordinates: new Float32Array(5),
                zIndex: new Uint8Array(5),
            },
            {
                from: new Int32Array([2]),
                to: new Int32Array([3]),
                value: new Uint8Array([1]),
                zIndex: new Uint8Array([0]),
                features: [],
            }
        );

        const target = [[0], [1], [3, 2], [4]];

        const communities = greedy_modularity_communities(graph, (c) => new Int32Array(c));

        assert.deepEqual(communities, target);

    });
    it("should create a single comminuty of a graph with two nodes linked to one node", () => {
        const graph = new OGraph<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >(
            {
                features: [new Int8Array([0, 1, 2, 3, 4])],
                xCoordinates: new Float32Array(5),
                yCoordinates: new Float32Array(5),
                zIndex: new Uint8Array(5),
            },
            {
                from: new Int32Array([2, 2]),
                to: new Int32Array([3, 0]),
                value: new Uint8Array([1, 1]),
                zIndex: new Uint8Array([0, 0]),
                features: [],
            }
        );

        const target = [[1], [3, 2, 0], [4]];

        const communities = greedy_modularity_communities(graph, (c) => new Int32Array(c));

        assert.deepEqual(communities, target);

    });
    it("should create two parallel comminuties of a graph with two groups of linked nodes", () => {
        const graph = new OGraph<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >(
            {
                features: [new Int8Array([0, 1, 2, 3, 4])],
                xCoordinates: new Float32Array(5),
                yCoordinates: new Float32Array(5),
                zIndex: new Uint8Array(5),
            },
            {
                from: new Int32Array([2, 2, 1]),
                to: new Int32Array([3, 0, 4]),
                value: new Uint8Array([1, 1, 1]),
                zIndex: new Uint8Array([0, 0, 0]),
                features: [],
            }
        );

        const target = [[0, 3, 2], [4, 1]];

        const communities = greedy_modularity_communities(graph, (c) => new Int32Array(c));

        assert.deepEqual(communities, target);

    });
    it("should not combine all nodes of a chain-graph", () => {
        const graph = new OGraph<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >(
            {
                features: [new Int8Array([0, 1, 2, 3, 4])],
                xCoordinates: new Float32Array(5),
                yCoordinates: new Float32Array(5),
                zIndex: new Uint8Array(5),
            },
            {
                from: new Int32Array([0, 1, 2, 3]),
                to: new Int32Array([1, 2, 3, 4]),
                value: new Uint8Array([1, 1, 1, 1]),
                zIndex: new Uint8Array([0, 0, 0, 0]),
                features: [],
            }
        );

        const target = [[2, 1, 0], [4, 3]];

        const communities = greedy_modularity_communities(graph, (c) => new Int32Array(c));

        assert.deepEqual(communities, target);

    });
    it("should not combine all nodes of a cirlce-graph", () => {
        const graph = new OGraph<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >(
            {
                features: [new Int8Array([0, 1, 2, 3, 4])],
                xCoordinates: new Float32Array(5),
                yCoordinates: new Float32Array(5),
                zIndex: new Uint8Array(5),
            },
            {
                from: new Int32Array([0, 1, 2, 3, 4]),
                to: new Int32Array([1, 2, 3, 4, 0]),
                value: new Uint8Array([1, 1, 1, 1, 1]),
                zIndex: new Uint8Array([0, 0, 0, 0, 0]),
                features: [],
            }
        );

        const target = [[3, 2], [4, 0, 1]];

        const communities = greedy_modularity_communities(graph, (c) => new Int32Array(c));

        assert.deepEqual(communities, target);

    });
    it("should combine all nodes of a full graph", () => {

        const nodeCount = 26;

        const graph = new OGraph<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >(
            {
                features: [new Int8Array(nodeCount)],
                xCoordinates: new Float32Array(nodeCount),
                yCoordinates: new Float32Array(nodeCount),
                zIndex: new Uint8Array(nodeCount),
            },
            {
                from: new Int32Array(Math.floor(nodeCount * (nodeCount - 1) / 2)),
                to: new Int32Array(Math.floor(nodeCount * (nodeCount - 1) / 2)),
                value: new Uint8Array(Math.floor(nodeCount * (nodeCount - 1) / 2)).fill(1),
                zIndex: new Uint8Array(Math.floor(nodeCount * (nodeCount - 1) / 2)),
                features: [],
            }
        );

        let t = 0;

        for (let i = 1; i < nodeCount; i++) {
            for (let j = 0; j < i; j++) {
                graph.connections.from[t] = i;
                graph.connections.to[t] = j;

                t ++;
            }
        }

        const communities = greedy_modularity_communities(graph, (c) => new Int32Array(c));

        assert.equal(communities.length, 1);
    });
    it("should combine all nodes of two full sub-graphs", () => {

        const nodeCountA = 26;
        const nodeCountB = 5;

        const connectionCountA = Math.floor(nodeCountA * (nodeCountA - 1) / 2);
        const connectionCountB = Math.floor(nodeCountB * (nodeCountB - 1) / 2);

        const graph = new OGraph<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >(
            {
                features: [new Int8Array(nodeCountA + nodeCountB)],
                xCoordinates: new Float32Array(nodeCountA + nodeCountB),
                yCoordinates: new Float32Array(nodeCountA + nodeCountB),
                zIndex: new Uint8Array(nodeCountA + nodeCountB),
            },
            {
                from: new Int32Array(connectionCountA + connectionCountB),
                to: new Int32Array(connectionCountA + connectionCountB),
                value: new Uint8Array(connectionCountA + connectionCountB).fill(1),
                zIndex: new Uint8Array(connectionCountA + connectionCountB),
                features: [],
            }
        );

        let t = 0;

        for (let i = 1; i < nodeCountA; i++) {
            for (let j = 0; j < i; j++) {
                graph.connections.from[t] = i;
                graph.connections.to[t] = j;

                t ++;
            }
        }
        for (let i = 1; i < nodeCountB; i++) {
            for (let j = 0; j < i; j++) {
                graph.connections.from[t] = i + nodeCountA;
                graph.connections.to[t] = j + nodeCountA;

                t ++;
            }
        }

        const communities = greedy_modularity_communities(graph, (c) => new Int32Array(c));

        assert.equal(communities.length, 2);
    });
    it("should not combine two full sub-graphs with a single connection bewteen them", () => {

        const nodeCountA = 26;
        const nodeCountB = 5;

        const connectionCountA = Math.floor(nodeCountA * (nodeCountA - 1) / 2);
        const connectionCountB = Math.floor(nodeCountB * (nodeCountB - 1) / 2);

        const connectionCount = connectionCountA + connectionCountB + 1;

        const graph = new OGraph<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >(
            {
                features: [new Int8Array(nodeCountA + nodeCountB)],
                xCoordinates: new Float32Array(nodeCountA + nodeCountB),
                yCoordinates: new Float32Array(nodeCountA + nodeCountB),
                zIndex: new Uint8Array(nodeCountA + nodeCountB),
            },
            {
                from: new Int32Array(connectionCount),
                to: new Int32Array(connectionCount),
                value: new Uint8Array(connectionCount).fill(1),
                zIndex: new Uint8Array(connectionCount),
                features: [],
            }
        );

        let t = 0;

        for (let i = 1; i < nodeCountA; i++) {
            for (let j = 0; j < i; j++) {
                graph.connections.from[t] = i;
                graph.connections.to[t] = j;

                t ++;
            }
        }
        for (let i = 1; i < nodeCountB; i++) {
            for (let j = 0; j < i; j++) {
                graph.connections.from[t] = i + nodeCountA;
                graph.connections.to[t] = j + nodeCountA;

                t ++;
            }
        }
        
        graph.connections.from[t] = 1 + nodeCountA;
        graph.connections.to[t] = 1;

        const communities = greedy_modularity_communities(graph, (c) => new Int32Array(c));

        assert.equal(communities.length, 2);
    });
    it("should split out a new community with a single node when two full sub-graphs have a single high-value connection bewteen them", () => {

        const nodeCountA = 26;
        const nodeCountB = 5;

        const connectionCountA = Math.floor(nodeCountA * (nodeCountA - 1) / 2);
        const connectionCountB = Math.floor(nodeCountB * (nodeCountB - 1) / 2);

        const connectionCount = connectionCountA + connectionCountB + 1;

        const graph = new OGraph<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >(
            {
                features: [new Int8Array(nodeCountA + nodeCountB)],
                xCoordinates: new Float32Array(nodeCountA + nodeCountB),
                yCoordinates: new Float32Array(nodeCountA + nodeCountB),
                zIndex: new Uint8Array(nodeCountA + nodeCountB),
            },
            {
                from: new Int32Array(connectionCount),
                to: new Int32Array(connectionCount),
                value: new Uint8Array(connectionCount).fill(1),
                zIndex: new Uint8Array(connectionCount),
                features: [],
            }
        );

        let t = 0;

        for (let i = 1; i < nodeCountA; i++) {
            for (let j = 0; j < i; j++) {
                graph.connections.from[t] = i;
                graph.connections.to[t] = j;

                t ++;
            }
        }
        for (let i = 1; i < nodeCountB; i++) {
            for (let j = 0; j < i; j++) {
                graph.connections.from[t] = i + nodeCountA;
                graph.connections.to[t] = j + nodeCountA;

                t ++;
            }
        }
        
        graph.connections.from[t] = 1 + nodeCountA;
        graph.connections.to[t] = 1;
        graph.connections.value[t] = 255;

        const communities = greedy_modularity_communities(graph, (c) => new Int32Array(c));

        assert.equal(communities.length, 3);
        assert.deepEqual(communities[1], [1 + nodeCountA, 1]);
    });
    it("should combine in parallel two big subgraphs", function (done) {

        this.timeout(20000);

        const nodeCountA = 1000;
        const nodeCountB = 1200;

        const connectionCountA = Math.floor(nodeCountA * (nodeCountA - 1) / 2);
        const connectionCountB = Math.floor(nodeCountB * (nodeCountB - 1) / 2);

        const connectionCount = connectionCountA + connectionCountB;

        const graph = new OGraph<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >(
            {
                features: [new Int8Array(nodeCountA + nodeCountB)],
                xCoordinates: new Float32Array(nodeCountA + nodeCountB),
                yCoordinates: new Float32Array(nodeCountA + nodeCountB),
                zIndex: new Uint8Array(nodeCountA + nodeCountB),
            },
            {
                from: new Int32Array(connectionCount),
                to: new Int32Array(connectionCount),
                value: new Uint8Array(connectionCount).fill(1),
                zIndex: new Uint8Array(connectionCount),
                features: [],
            }
        );

        let t = 0;

        for (let i = 1; i < nodeCountA; i++) {
            for (let j = 0; j < i; j++) {
                graph.connections.from[t] = i;
                graph.connections.to[t] = j;

                t ++;
            }
        }
        for (let i = 1; i < nodeCountB; i++) {
            for (let j = 0; j < i; j++) {
                graph.connections.from[t] = i + nodeCountA;
                graph.connections.to[t] = j + nodeCountA;

                t ++;
            }
        }
        
        const communities = greedy_modularity_communities(graph, (c) => new Int32Array(c));

        assert.equal(communities.length, 2);

        done();
    });
});
