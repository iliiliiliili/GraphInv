import assert from "assert";

import DecayingMaxHeap from "../../src/clustering/decaying-max-heap";

describe("DecayingMaxHeap tests", () => {
    it("should create heap and extract all elements in the max-sorted manner", () => {
        const heap = new DecayingMaxHeap<[Uint8Array], Float32Array>(
            10,
            (c) => [new Uint8Array(c)],
            (c) => new Float32Array(c),
            0
        );

        const values = [
            [14, 4],
            [11, 1],
            [13, 3],
            [10, 0],
            [12, 2],
        ];

        const target = [
            [14, 4],
            [13, 3],
            [12, 2],
            [11, 1],
            [10, 0],
        ];

        values.forEach(([k, v]) => {
            heap.push(k, v);
        });

        const result: [number, number][] = [];

        while (heap.currentSize > 0) {
            const [k, v] = heap.pop();
            result.push([k as number, v]);
        }

        assert.deepEqual(result, target);
    });
    it("should create heap and extract all elements in the max-sorted manner for multiple keys", () => {
        const heap = new DecayingMaxHeap<[Uint8Array, Uint8Array, Int32Array], Float32Array>(
            10,
            (c) => [
                new Uint8Array(c),
                new Uint8Array(c),
                new Int32Array(c),
            ],
            (c) => new Float32Array(c),
            0
        );

        const values = [
            [[14, 24, 100004], 4],
            [[11, 21, 100001], 1],
            [[13, 23, 100003], 3],
            [[10, 20, 100000], 0],
            [[12, 22, 100002], 2],
        ];

        const target = [
            [[14, 24, 100004], 4],
            [[13, 23, 100003], 3],
            [[12, 22, 100002], 2],
            [[11, 21, 100001], 1],
            [[10, 20, 100000], 0],
        ];

        values.forEach(([k, v]) => {
            heap.push(k, v as number);
        });

        const result: [number, number][] = [];

        while (heap.currentSize > 0) {
            const [k, v] = heap.pop();
            result.push([k as number, v]);
        }

        assert.deepEqual(result, target);
    });

    it("should optimize size of the array at every pop with optimizeMemoryAfterSizeDecreasedBy=1", () => {
        const maxSize = 10;

        const heap = new DecayingMaxHeap<[Uint8Array], Uint8Array>(
            maxSize,
            (c) => [new Uint8Array(c)],
            (c) => new Uint8Array(c),
            1
        );

        const values = [
            [14, 4],
            [11, 1],
            [10, 0],
            [13, 3],
            [12, 2],
        ];

        values.forEach(([k, v]) => {
            heap.push(k, v);
            assert.equal(
                heap.heapValues.length,
                maxSize,
                "heapValues.length is not maxSize"
            );

            for (let i = 0; i < heap.heapKeys.length; i++) {
                assert.equal(
                    heap.heapKeys[i].length,
                    maxSize,
                    "heapKeys[i].length is not maxSize"
                );
            }
        });

        const result: [number, number][] = [];

        while (heap.currentSize > 0) {
            const [k, v] = heap.pop();
            result.push([k as number, v]);
            assert.equal(
                heap.heapValues.length,
                heap.currentSize,
                "heapValues.length is not currentSize"
            );
            for (let i = 0; i < heap.heapKeys.length; i++) {
                assert.equal(
                    heap.heapKeys[i].length,
                    heap.currentSize,
                    "heapKeys[i].length is not currentSize"
                );
            }
        }
    });
    it("should optimize size of the array when it is twice smaller with optimizeMemoryAfterSizeDecreasedBy=0.5", () => {
        const maxSize = 64;

        const optimizeMemoryAfterSizeDecreasedBy = 0.5;

        const heap = new DecayingMaxHeap<[Uint8Array], Uint8Array>(
            maxSize,
            (c) => [new Uint8Array(c)],
            (c) => new Uint8Array(c),
            optimizeMemoryAfterSizeDecreasedBy
        );

        const values = new Array(maxSize).fill(undefined).map((_, i) => [i + 100, i]);

        values.forEach(([k, v]) => {
            heap.push(k, v);
            assert.equal(
                heap.heapValues.length,
                maxSize,
                "heapValues.length is not maxSize"
            );

            for (let i = 0; i < heap.heapKeys.length; i++) {
                assert.equal(
                    heap.heapKeys[i].length,
                    maxSize,
                    "heapKeys[i].length is not maxSize"
                );
            }
        });

        let lastSize = maxSize;

        while (heap.currentSize > 0) {
            heap.pop();

            if (
                heap.currentSize <=
                optimizeMemoryAfterSizeDecreasedBy * lastSize
            ) {
                assert.equal(
                    heap.heapValues.length,
                    heap.currentSize,
                    "heapValues.length is not currentSize"
                );
                for (let i = 0; i < heap.heapKeys.length; i++) {
                    assert.equal(
                        heap.heapKeys[i].length,
                        heap.currentSize,
                        "heapKeys[i].length is not currentSize"
                    );
                }

                lastSize = heap.currentSize;
            } else {

                assert.equal(
                    heap.heapValues.length,
                    lastSize,
                    "heapValues.length is not lastSize"
                );
                for (let i = 0; i < heap.heapKeys.length; i++) {
                    assert.equal(
                        heap.heapKeys[i].length,
                        lastSize,
                        "heapKeys[i].length is not lastSize"
                    );
                }
            }
        }
    });
    it("should throw on trying to push more than maxSize elements", () => {
        const heap = new DecayingMaxHeap<[Uint8Array], Float32Array>(
            3,
            (c) => [new Uint8Array(c)],
            (c) => new Float32Array(c),
            0
        );

        const values = [
            [14, 4],
            [11, 1],
            [13, 3],
            [10, 0],
            [12, 2],
        ];

        assert.throws(() => {

            values.forEach(([k, v]) => {
                heap.push(k, v);
            });
        });
    });
    it("should remove element by key", () => {
        const heap = new DecayingMaxHeap<[Uint8Array], Float32Array>(
            10,
            (c) => [new Uint8Array(c)],
            (c) => new Float32Array(c),
            0
        );

        const values = [
            [14, 4],
            [11, 1],
            [13, 3],
            [10, 0],
            [12, 2],
        ];

        const orders = [
            [13, 10, 11, 12, 14],
            [13, 10, 11, 14, 12],
            [11, 13, 10, 12, 14],
            [13, 14, 10, 11, 12],
            [11, 13, 10, 12, 14],
            [12, 13, 10, 11, 14],
        ];


        orders.forEach(order => {
            values.forEach(([k, v]) => {
                heap.push(k, v);
            });
    
            const result: [number, number][] = [];

            const target = order.map(a => [a, a - 10]);

            order.forEach((key) => {
                const [k, v] = heap.remove(key);
                result.push([k as number, v]);
            });

            assert.deepEqual(result, target);
        })
    });
    it("should throw on removing non-existing elements", () => {
        const heap = new DecayingMaxHeap<[Uint8Array], Float32Array>(
            10,
            (c) => [new Uint8Array(c)],
            (c) => new Float32Array(c),
            0
        );

        const values = [
            [14, 4],
            [11, 1],
            [13, 3],
            [10, 0],
            [12, 2],
        ];

        const orders = [
            [113, 10, 11, 12, 14],
            [13, 210, 11, 14, 12],
            [11, 13, 10.2, 12, 14],
            [13, 14, 10, 311, 12],
            [11, 13, 10, 12, 124],
            [12, 13, 10, 11, -14],
        ];


        orders.forEach(order => {
            values.forEach(([k, v]) => {
                heap.push(k, v);
            });
    
            assert.throws(() => {
                order.forEach((key) => {
                    heap.remove(key);
                });
            });

            while (heap.currentSize > 0) {
                heap.pop();
            }
        })
    });
});
