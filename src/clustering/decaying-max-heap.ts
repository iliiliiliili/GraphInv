type TypedArray =
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array;

export type IntTypedArray =
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array;

type NestedKeyPositionMap = { [key: number]: number | NestedKeyPositionMap };

/**
 * DecayingHeap<T> uses a set of integer numbers as key and a number as a value.
 * It optimizes memory usage for tasks that mostly decrease in size after the innitial memory allocation.
 * Supports node removal by index.
 */
export class DecayingMaxHeap<
    TKey extends IntTypedArray[],
    TValue extends TypedArray
> {
    heapKeys: TKey;
    heapValues: TValue;
    optimizeMemoryAfterSizeDecreasedBy: number;
    maxSize: number;
    currentSize: number;
    supportNodeRemovalByKey: boolean;
    nodeKeyPositionMap: NestedKeyPositionMap = {};
    createKeys: (count: number) => TKey;
    createValues: (count: number) => TValue;
    minMaxSize = 0;
    expandOnPush = 2;

    constructor(
        maxSize: number,
        createKeys: (count: number) => TKey,
        createValues: (count: number) => TValue,
        optimizeMemoryAfterSizeDecreasedBy = 0.5,
        supportNodeRemovalByKey = true
    ) {
        this.createKeys = createKeys;
        this.createValues = createValues;

        this.heapKeys = this.createKeys(maxSize);
        this.heapValues = this.createValues(maxSize);
        this.maxSize = maxSize;
        this.currentSize = 0;
        this.optimizeMemoryAfterSizeDecreasedBy =
            optimizeMemoryAfterSizeDecreasedBy;
        this.supportNodeRemovalByKey = supportNodeRemovalByKey;
    }

    public push(key: number | number[], value: number, expandIfNeeded = false) {
        if (this.heapKeys.length == 1) {
            if (typeof key == "number") {
                key = [key];
            }
        }

        if (typeof key == "number") {
            throw Error("Expect a set of numbers as keys");
        }

        if (this.currentSize + 1 > this.maxSize) {

            if (expandIfNeeded) {

                this.expand(this.expandOnPush);
            } else {

                throw Error("Exceeded max size");
            }

        }

        this.assignValue(this.currentSize, value, key);

        this.currentSize++;

        this.siftdown(0, this.currentSize - 1, value, key);
    }

    public topKey() {
        return this.currentSize > 0 ? this.keyAt(0) : undefined;
    }

    private keyAt(position: number) {
        return this.heapKeys.length == 1
            ? this.heapKeys[0][position]
            : this.heapKeys.map((k) => k[position]);
    }

    public topValue() {
        return this.heapValues[0];
    }

    public top() {
        return [this.topKey(), this.topValue()] as const;
    }

    public pop(optimizeMemory = true) {
        const latestId = this.currentSize - 1;
        const key = this.topKey();
        const value = this.topValue();

        if (this.supportNodeRemovalByKey) {
            this.removeNodePositionInMap(typeof key == "number" ? [key] : key);
        }

        this.currentSize--;

        if (latestId > 0) {
            this.assign(0, latestId);

            this.siftup(
                0,
                this.currentSize,
                this.heapValues[0],
                this.heapKeys.map((k) => k[0])
            );
        }

        if (optimizeMemory) {
            this.optimizeMemoryIfNeeded();
        }

        return [key, value] as const;
    }

    public remove(key: number | number[], optimizeMemory = true) {
        if (!this.supportNodeRemovalByKey) {
            throw Error("supportNodeRemovalByKey is not set to true");
        }

        if (this.heapKeys.length == 1) {
            if (typeof key == "number") {
                key = [key];
            }
        }

        if (typeof key == "number") {
            throw Error("Expect a set of numbers as keys");
        }

        const latestId = this.currentSize - 1;
        const position = this.getNodePositionInMap(key);
        const outputKey = this.keyAt(position);
        const value = this.heapValues[position];

        this.removeNodePositionInMap(key);

        this.currentSize--;

        if (latestId > 0) {
            this.assign(position, latestId);

            this.siftup(
                position,
                this.currentSize,
                this.heapValues[position],
                this.heapKeys.map((k) => k[position])
            );
        }

        if (optimizeMemory) {
            this.optimizeMemoryIfNeeded();
        }

        return [outputKey, value] as const;
    }

    public updateValue(key: number | number[], newValue: number) {
        if (!this.supportNodeRemovalByKey) {
            throw Error("supportNodeRemovalByKey is not set to true");
        }

        if (this.heapKeys.length == 1) {
            if (typeof key == "number") {
                key = [key];
            }
        }

        if (typeof key == "number") {
            throw Error("Expect a set of numbers as keys");
        }

        const position = this.getNodePositionInMap(key);
        const oldValue = this.heapValues[position];
        this.heapValues[position] = newValue;

        if (newValue > oldValue) {
            this.siftdown(0, position, newValue, key);
        } else {
            this.siftup(position, this.currentSize - 1, newValue, key);
        }
    }

    public expand(sizeToAdd: number, roundUpMultiplier = 1.5) {
        const newSize = Math.floor(
            Math.max(this.maxSize + sizeToAdd, this.maxSize * roundUpMultiplier)
        );

        const heapValues = this.createValues(newSize);
        const heapKeys = this.createKeys(newSize);

        heapValues.set(this.heapValues);
        this.heapValues = heapValues;

        for (let i = 0; i < this.heapKeys.length; i++) {
            heapKeys[i].set(this.heapKeys[i]);
            this.heapKeys[i] = heapKeys[i];
        }

        this.maxSize = newSize;
    }

    private assign(target: number, source: number) {
        this.heapValues[target] = this.heapValues[source];

        for (let i = 0; i < this.heapKeys.length; i++) {
            this.heapKeys[i][target] = this.heapKeys[i][source];
        }

        if (this.supportNodeRemovalByKey) {
            this.setNodePositionInMap(
                this.heapKeys.map((k) => k[target]),
                target
            );
        }
    }

    private assignValue(target: number, newValue: number, newKey: number[]) {
        this.heapValues[target] = newValue;

        for (let i = 0; i < this.heapKeys.length; i++) {
            this.heapKeys[i][target] = newKey[i];
        }

        if (this.supportNodeRemovalByKey) {
            this.setNodePositionInMap(newKey, target);
        }
    }

    private siftdown(
        start: number,
        position: number,
        newValue: number,
        newKey: number[]
    ) {
        while (position > start) {
            const parent = (position - 1) >> 1;
            const parentValue = this.heapValues[parent];

            if (newValue > parentValue) {
                this.assign(position, parent);
                position = parent;
            } else {
                break;
            }
        }

        this.assignValue(position, newValue, newKey);
    }

    private siftup(
        position: number,
        end: number,
        newValue: number,
        newKey: number[]
    ) {
        const start = position;

        let childPosition = 2 * position + 1;

        while (childPosition < end) {
            const rightChildPosition = childPosition + 1;

            if (
                rightChildPosition < end &&
                !(
                    this.heapValues[childPosition] >
                    this.heapValues[rightChildPosition]
                )
            ) {
                childPosition = rightChildPosition;
            }

            this.assign(position, childPosition);
            position = childPosition;
            childPosition = 2 * childPosition + 1;
        }

        this.assignValue(position, newValue, newKey);

        this.siftdown(start, position, newValue, newKey);
    }

    private optimizeMemoryIfNeeded() {
        if (
            this.minMaxSize <= this.currentSize &&
            this.optimizeMemoryAfterSizeDecreasedBy > 0 &&
            this.currentSize <=
                this.maxSize * this.optimizeMemoryAfterSizeDecreasedBy
        ) {
            // Subarray does not free memory.
            // Test: node --exppose-gc; const a = {}; a.y = new Float64Array(1000*1000*1000).fill(2605);
            // a.y = null; global.gc(); // this results in a.y being collected;
            // a.y = a.y.subarray(0, 10); global.gc(); // this results in no change in RAM used.
            //
            // And therefore, this approach cannot be used.
            // this.heapValues = this.heapValues.subarray(0, this.currentSize) as TValue;

            this.heapValues = this.heapValues.slice(
                0,
                this.currentSize
            ) as TValue;

            for (let i = 0; i < this.heapKeys.length; i++) {
                this.heapKeys[i] = this.heapKeys[i].slice(0, this.currentSize);
            }

            this.maxSize = this.currentSize;
        }
    }

    private setNodePositionInMap(key: number[], position: number) {
        let currentSubMap = this.nodeKeyPositionMap;

        for (let i = 0; i < this.heapKeys.length - 1; i++) {
            if (!(key[i] in currentSubMap)) {
                currentSubMap[key[i]] = {};
            }
            currentSubMap = currentSubMap[key[i]] as NestedKeyPositionMap;
        }

        currentSubMap[key[key.length - 1]] = position;
    }

    private removeNodePositionInMap(key: number[]) {
        let currentSubMap = this.nodeKeyPositionMap;

        for (let i = 0; i < this.heapKeys.length - 1; i++) {
            if (!(key[i] in currentSubMap)) {
                currentSubMap[key[i]] = {};
            }
            currentSubMap = currentSubMap[key[i]] as NestedKeyPositionMap;
        }

        delete currentSubMap[key[key.length - 1]];
    }

    private getNodePositionInMap(key: number[]) {
        let currentSubMap = this.nodeKeyPositionMap;

        for (let i = 0; i < this.heapKeys.length - 1; i++) {
            if (!(key[i] in currentSubMap)) {
                currentSubMap[key[i]] = {};
            }
            currentSubMap = currentSubMap[key[i]] as NestedKeyPositionMap;
        }

        if (!(key[key.length - 1] in currentSubMap)) {
            throw Error(`Key ${key} is not in the heap`);
        }

        return currentSubMap[key[key.length - 1]] as number;
    }
}
