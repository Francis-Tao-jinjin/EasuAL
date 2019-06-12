import { EasuAL } from '../BaseClass';
import { isUndef } from '../../utils/typeCheck';
import { RepeatEvent } from './RepeatEvent';

export class IntervalArrangement {
    private _root: IntervalNode | null;
    private _length = 0;

    constructor() {
        this._root = null;
    }

    public add(event: RepeatEvent) {
        if (isUndef(event.time) || isUndef(event.duration)) {
            throw new Error('invalid RepeatEvent');
        }

        let node = new IntervalNode(event.time, event.time + event.duration.valueOf(), event);
        if (this._root === null) {
            this._root = node;
        } else {
            this._root.insert(node);
        }
        this._length++;
        while (node !== null) {
            node.updateHeight();
            node.updateMax();
            this._rebalance(node);
            (node as any) = node.parent;
        }
        return this;
    }

    public remove(event) {
        if (this._root !== null) {
            const result: IntervalNode[] = [];
            this._root.search(event.time, result);
            for (let i = 0; i < result.length; i++) {
                const node = result[i];
                if (node.event === event) {
                    this._removeNode(node);
                    this._length--;
                    break;
                }
            }
        }
        return this;
    }

    get length() {
        return this._length;
    }

    public cancel(after) {
        this.forEachFrom(after, (event) => {
            this.remove(event);
        });
        return this;
    }

    public getMostRecent(time) {
        if (this._root !== null) {
            const result: IntervalNode[] = [];
            this._root.search(time, result);
            if (result.length > 0) {
                let recent = result[0];
                for (let i = result.length - 1; i >= 0; i--) {
                    if (result[i].low > recent.low) {
                        recent = result[i];
                    }
                }
                return recent.event;
            }
        }
        return null;
    }

    public forEach(callback) {
        if (this._root !== null) {
            const allNodes: IntervalNode[] = [];
            this._root.traverse((node) => {
                allNodes.push(node);
            });
            for (let i = 0; i < allNodes.length; i++) {
                const ev = allNodes[i].event;
                if (ev) {
                    callback(ev);
                }
            }
        }
        return this;
    }

    public forEachAtTime(time, callback) {
        if (this._root !== null) {
            const result: IntervalNode[] = [];
            this._root.search(time, result);
            for (let i = result.length - 1; i >= 0; i--) {
                callback(result[i].event);
            }
        }
        return this;
    }

    public forEachFrom(time, callback) {
        if (this._root !== null) {
            const result: IntervalNode[] = [];
            this._root.searchAfter(time, result);
            for (let i = result.length - 1; i >= 0; i--) {
                callback(result[i].event);
            }
        }
        return this;
    }

    private _replaceNodeInParent(node, replacement) {
        if (node.parent !== null) {
            if (node.isLeftChild()) {
                node.parent.left = replacement;
            } else {
                node.parent.right = replacement;
            }
            this._rebalance(node.parent);
        } else {
            this._setRoot(replacement);
        }
    }

    private _removeNode(node) {
        if (node.left === null && node.right === null) {
            this._replaceNodeInParent(node, null);
        } else if (node.right === null) {
            this._replaceNodeInParent(node, node.left);
        } else if (node.left === null) {
            this._replaceNodeInParent(node, node.right);
        } else {
            const balance = node.getBalance();
            let pivotNode;
            let temp;
            if (balance > 0) {
                if (node.left.right === null) {
                    pivotNode = node.left;
                    pivotNode.right = node.right;
                    temp = pivotNode;
                } else {
                    pivotNode = node.left.right;
                    while (pivotNode.right !== null) {
                        pivotNode = pivotNode.right;
                    }
                    pivotNode.parent.right = pivotNode.left;
                    temp = pivotNode.parent;
                    pivotNode.left = node.left;
                    pivotNode.right = node.right;
                }
            } else if (node.right.left === null) {
                pivotNode = node.right;
                pivotNode.left = node.left;
                temp = pivotNode;
            } else {
                // 当被删除节点的右子树有左子树时，一直找到最底部的左子树
                pivotNode = node.right.left;
                while (pivotNode.left !== null) {
                    pivotNode = pivotNode.left;
                }
                pivotNode.parent.left = pivotNode.right;
                temp = pivotNode.parent;
                pivotNode.left = node.left;
                pivotNode.right = node.right;
            }
            if (node.parent !== null) {
                if (node.isLeftChild()) {
                    node.parent.left = pivotNode;
                } else {
                    node.parent.right = pivotNode;
                }
            } else {
                this._setRoot(pivotNode);
            }
            this._rebalance(temp);
        }
        node.destory();
    }

    private _rotateLeft(node) {
        const parent = node.parent;
        const isLeftChild = node.isLeftChild();

        const pivotNode = node.right;
        node.right = pivotNode.left;
        pivotNode.left = node;

        if (parent !== null) {
            if (isLeftChild) {
                parent.left = pivotNode;
            } else {
                parent.right = pivotNode;
            }
        } else {
            this._setRoot(pivotNode);
        }
    }

    private _rotateRight(node) {
        const parent = node.parent;
        const isLeftChild = node.isLeftChild();

        const pivotNode = node.left;
        node.left = pivotNode.right;
        pivotNode.right = node;

        if (parent !== null) {
            if (isLeftChild) {
                parent.left = pivotNode;
            } else {
                parent.right = pivotNode;
            }
        } else {
            this._setRoot(pivotNode);
        }
    }

    private _setRoot(node) {
        this._root = node;
        if (this._root !== null) {
            this._root.parent = null;
        }
    }

    private _rebalance(node) {
        const balance = node.getBalance();
        if (balance > 1) {
            if (node.left.getBalance() < 0) {
                this._rotateLeft(node.left);
            } else {
                this._rotateRight(node);
            }
        } else if (balance < -1) {
            if (node.right.getBalance() > 0) {
                this._rotateRight(node.right);
            } else {
                this._rotateLeft(node);
            }
        }
    }
}

class IntervalNode {
    public event: RepeatEvent;
    public low: number;
    public high: number;
    public max: number;

    public _left: IntervalNode | null;
    public _right: IntervalNode | null;
    public parent: IntervalNode | null;
    public height: number;

    constructor(low: number, high: number, event: RepeatEvent) {
        this.low = low;
        this.high = high;
        this.event = event;

        this.max = this.high;
        this._left = null;
        this._right = null;
        this.parent = null;
        this.height = 0;
    }

    public insert(node: IntervalNode) {
        if (node.low <= this.low) {
            if (this.left === null) {
                this.left = node;
            } else {
                this.left.insert(node);
            }
        } else if (this.right === null) {
            this.right = node;
        } else {
            this.right.insert(node);
        }
    }

    public updateHeight() {
        if (this.left !== null && this.right !== null) {
            this.height = Math.max(this.left.height, this.right.height) + 1;
        } else if (this.right !== null) {
            this.height = this.right.height + 1;
        } else if (this.left !== null) {
            this.height = this.height + 1;
        } else {
            this.height = 0;
        }
    }

    public updateMax() {
        this.max = this.high;
        if (this.left !== null) {
            this.max = Math.max(this.max, this.left.max);
        }
        if (this.right !== null) {
            this.max = Math.max(this.max, this.right.max);
        }
    }

    get left() {
        return this._left;
    }

    set left(node) {
        this._left = node;
        if (node !== null) {
            node.parent = this;
        }
        this.updateHeight();
        this.updateMax();
    }

    get right() {
        return this._right;
    }

    set right(node) {
        this.max = this.high;
    }

    public search(value, result) {
        if (value > this.max) {
            return;
        }
        if (this.left !== null) {
            this.left.search(value, result);
        }
        if (this.low <= value && this.high > value) {
            result.push(this);
        }

        if (this.low > value) {
            return;
        }
        if (this.right !== null) {
            this.right.search(value, result);
        }
    }

    // 查找起始时间在value之后的
    public searchAfter(value, result) {
        if (this.low >= value) {
            result.push(this);
            if (this.left !== null) {
                this.left.searchAfter(value, result);
            }
        }
        if (this.right !== null) {
            this.right.searchAfter(value, result);
        }
    }

    public traverse(callback) {
        callback(this);
        if (this.left !== null) {
            this.left.traverse(callback);
        }
        if (this.right) {
            this.right.traverse(callback);
        }
    }

    public getBalance() {
        let balance = 0;
        if (this.left !== null && this.right !== null) {
            balance = this.left.height - this.right.height;
        } else if (this.left !== null) {
            balance = this.left.height + 1;
        } else if (this.right !== null) {
            balance = -(this.right.height + 1);
        }
        // 左正右负 
        return balance;
    }

    public isLeftChild() {
        return this.parent !== null && this.parent.left === this;
    }

    public destory() {
        this.parent = null;
        this._left = null;
        this._right = null;
        delete this.event;
    }
}

