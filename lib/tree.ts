interface Node {
  children?: Node[]
}

export function recursiveFilter<T extends Node>(nodes: T[],
                                                predicateFunction: (node: T) => boolean): T[] {
  return nodes.filter(predicateFunction).map((node) => {
    return Object.assign(node, {children: recursiveFilter(node.children, predicateFunction)})
  })
}

export function recursiveTransform<S extends Node,
                                   T extends Node>(nodes: S[],
                                                   transformFunction: (node: S) => T): T[] {
  return nodes.map(node => {
    return Object.assign(transformFunction(node),
                         {children: recursiveTransform(node.children, transformFunction)})
  })
}

export function recursiveSearch<T extends Node>(nodes: T[],
                                                predicateFunction: (node: T) => boolean): T[] {
  const results: T[] = []
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (predicateFunction(node)) {
      results.push(node)
    }
    Array.prototype.push.apply(results, recursiveSearch(node.children, predicateFunction))
  }
  return results
}

/**
Returns the first result.
*/
export function recursiveFind<T extends Node>(nodes: T[],
                                              predicateFunction: (node: T) => boolean): T {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (predicateFunction(node)) {
      return node
    }
    const children = node.children as T[]
    const children_result = recursiveFind<T>(children, predicateFunction)
    if (children_result) {
      return children_result
    }
  }
}

/**
depth-first recursion helper
*/
export function recursiveEach<T extends Node>(nodes: T[],
                                              fn: (node: T) => void): void {
  nodes.forEach(node => {
    fn(node)
    recursiveEach(node.children, fn)
  })
}
