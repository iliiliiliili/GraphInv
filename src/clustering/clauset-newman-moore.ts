import { OGraph } from "osigma";
import { TypedArray } from "osigma/core/ograph";
import { DecayingMaxHeap, IntTypedArray } from "./decaying-max-heap";

type DeltaQ = { [key: number]: { [key: number]: number } };

export default function greedy_modularity_communities<
    TId extends IntTypedArray,
    TConnectionWeight extends TypedArray,
    TCoordinates extends TypedArray,
    TZIndex extends TypedArray,
    TNodeFeatures extends TypedArray[],
    TConnectionFeatures extends TypedArray[],
    TQ extends TypedArray = Float32Array
>(
    graph: OGraph<
        TId,
        TConnectionWeight,
        TCoordinates,
        TZIndex,
        TNodeFeatures,
        TConnectionFeatures
    >,
    createId: (count: number) => TId,
    options: {
        createQ?: (count: number) => TQ,
        resolution?: number,
        cutoff?: number,
        verbose?: boolean,
    } = {}
) {

    const createQ = options.createQ ?? ((c) => new Float32Array(c) as TQ);
    const resolution = options.resolution ?? 1;
    const cutoff = options.cutoff ?? 1;
    const verbose = options.verbose ?? false;

    let communities: number[][];

    const createNormalizedWeightedDegrees = (): [Float32Array, number] => {
        const result = new Float32Array(graph.nodeCount);
        let m = 0;

        for (let i = 0; i < graph.connectionCount; i++) {
            const weight = graph.connections.value[i];
            result[graph.connections.from[i]] += weight;
            result[graph.connections.to[i]] += weight;

            m += weight;
        }

        const reverseM = 1 / m;

        for (let i = 0; i < graph.nodeCount; i++) {
            result[i] /= 2 * m;
        }

        return [result, reverseM];
    };

    const [a, reverseM] = createNormalizedWeightedDegrees();

    const createDeltaQ = (): DeltaQ => {
        const result: DeltaQ = {};

        for (let i = 0; i < graph.nodeCount; i++) {
            result[i] = {};
        }

        for (let i = 0; i < graph.connectionCount; i++) {
            const weight = graph.connections.value[i];
            const from = graph.connections.from[i];
            const to = graph.connections.to[i];

            if (!(from in result)) {
                result[from] = {};
            }
            if (!(to in result)) {
                result[to] = {};
            }

            if (!(from in result[to])) {
                result[to][from] = 0;
            }
            if (!(to in result[from])) {
                result[from][to] = 0;
            }

            result[from][to] += weight;
            result[to][from] += weight;
        }

        for (const from in result) {
            for (const to in result[from]) {
                result[from][to] =
                    reverseM * result[from][to] -
                    resolution * 2 * a[from] * a[to];
            }
        }

        return result;
    };

    const deltaQ = createDeltaQ();

    const createHeaps = (): [
        { [key: number]: DecayingMaxHeap<[TId], TQ> },
        DecayingMaxHeap<[TId, TId], TQ>
    ] => {
        const deltaQHeaps: { [key: number]: DecayingMaxHeap<[TId], TQ> } = {};
        const totalHeap = new DecayingMaxHeap<[TId, TId], TQ>(
            graph.nodeCount,
            (c) => [createId(c), createId(c)],
            createQ
        );

        for (let i = 0; i < graph.nodeCount; i++) {
            const keys = Object.keys(deltaQ[i]).map((a) => parseInt(a));

            const heap = new DecayingMaxHeap<[TId], TQ>(
                keys.length + 1,
                (c) => [createId(c)],
                createQ
            );

            heap.minMaxSize = 2;

            for (const q of keys) {
                heap.push(q, deltaQ[i][q]);
            }

            deltaQHeaps[i] = heap;

            const [k, dq] = heap.top();

            if (k !== undefined) {
                totalHeap.push([i, k as number], dq);
            }
        }

        return [deltaQHeaps, totalHeap];
    };

    const [deltaQHeaps, totalHeap] = createHeaps();

    communities = new Array(graph.nodeCount).fill(undefined).map((_, i) => [i]);

    const step = () => {
        if (totalHeap.currentSize > 1) {
            const [k, topDeltaQ] = totalHeap.pop(false);

            if (topDeltaQ < 0) {
                return topDeltaQ;
            }

            const [u, v] = k as [number, number];

            const mergeUIntoV = () => {
                const updateHeapTopsByRemovingU = () => {
                    deltaQHeaps[u].pop();

                    if (deltaQHeaps[u].currentSize > 0) {
                        const [key, dq] = deltaQHeaps[u].top();
                        totalHeap.push([u, key as number], dq);
                    }

                    if (deltaQHeaps[v].top()[0] == u) {
                        totalHeap.remove(
                            [v, u],
                            deltaQHeaps[v].currentSize <= 0
                        );
                        deltaQHeaps[v].remove(
                            u,
                        );

                        if (deltaQHeaps[v].currentSize > 0) {
                            const [key, dq] = deltaQHeaps[v].top();
                            totalHeap.push([v, key as number], dq);
                        }
                    } else {
                        deltaQHeaps[v].remove(
                            u,
                        );
                    }
                };

                updateHeapTopsByRemovingU();

                communities[v].push(...communities[u]);
                delete communities[u];

                const uNeighbours = new Set(
                    Object.keys(deltaQ[u]).map((a) => parseInt(a))
                );

                const updateDeltaQForAffectedCommunities = () => {
                    const vNeighbours = new Set(
                        Object.keys(deltaQ[v]).map((a) => parseInt(a))
                    );

                    const allNeighbours = new Set([
                        ...uNeighbours,
                        ...vNeighbours,
                    ]);
                    allNeighbours.delete(u);
                    allNeighbours.delete(v);

                    const commonNeighbours = new Set(
                        [...uNeighbours].filter((x) => vNeighbours.has(x))
                    );

                    const amountToPush = uNeighbours.size - commonNeighbours.size;

                    const spaceLeftV =
                        deltaQHeaps[v].maxSize - deltaQHeaps[v].currentSize;
                    if (spaceLeftV < amountToPush) {
                        deltaQHeaps[v].expand(amountToPush - spaceLeftV);
                    }

                    allNeighbours.forEach((w) => {
                        let dq_vw: number;

                        if (commonNeighbours.has(w)) {
                            dq_vw = deltaQ[v][w] + deltaQ[u][w];
                        } else if (vNeighbours.has(w)) {
                            dq_vw = deltaQ[v][w] - resolution * 2 * a[u] * a[w];
                        } else {
                            dq_vw = deltaQ[u][w] - resolution * 2 * a[v] * a[w];
                        }

                        for (const [r, c] of [
                            [v, w],
                            [w, v],
                        ]) {
                            deltaQ[r][c] = dq_vw;

                            let dOldMax: [number, number] | null = null;

                            if (deltaQHeaps[r].currentSize > 0) {
                                dOldMax = deltaQHeaps[r].top() as [
                                    number,
                                    number
                                ];
                            }

                            if (vNeighbours.has(w)) {
                                deltaQHeaps[r].updateValue(c, dq_vw);
                            } else {
                                deltaQHeaps[r].push(c, dq_vw);
                            }

                            if (dOldMax == null) {
                                totalHeap.push([r, c], dq_vw);
                            } else {
                                const rMax = deltaQHeaps[r].top();

                                if (
                                    dOldMax[0] != rMax[0] ||
                                    dOldMax[1] != rMax[1]
                                ) {
                                    totalHeap.remove([r, dOldMax[0]], false);
                                    totalHeap.push(
                                        [r, rMax[0] as number],
                                        rMax[1]
                                    );
                                }
                            }
                        }
                    });
                };

                updateDeltaQForAffectedCommunities();

                const removeUEntries = () => {
                    uNeighbours.forEach((w) => {
                        delete deltaQ[w][u];

                        if (w != v) {
                            for (const [r, c] of [
                                [u, w],
                                [w, u],
                            ]) {
                                if (deltaQHeaps[r].top()[0] == c) {
                                    deltaQHeaps[r].pop();
                                    totalHeap.remove([r, c], false);

                                    const [k, dq] = deltaQHeaps[r].top();

                                    if (deltaQHeaps[r].currentSize > 0) {
                                        totalHeap.push([r, k as number], dq);
                                    }
                                } else {
                                    deltaQHeaps[r].remove(c);
                                }
                            }
                        }
                    });
                };

                removeUEntries();

                delete deltaQ[u];
                delete deltaQHeaps[u];
                a[v] += a[u];
                a[u] = 0;
            };

            mergeUIntoV();

            return topDeltaQ;
        }

        return -Infinity;
    };

    while (communities.length > cutoff) {
        const dq = step();

        if (verbose) {

            console.log({dq, communities: communities.filter((a) => a !== undefined)});
        }
        if (dq < 0) {
            break;
        }
    }

    const result = communities.filter((a) => a !== undefined);

    return result;
}
