(ns formious.tree
  "tree-structure tools (functionality akin to clojure.walk,
  but specialized for our data structures)")

(defn node?
  "Returns true if `node`'s children (if it has any) are all nodes.
  The given `node` must be a map."
  [node]
  {:pre [(map? node)]}
  (every? node? (:children node)))

; The {map,filter,remove,replace}-recursively functions take a collection of nodes
; because this works out nicer when recurring

(defn map-recursively
  "Recursively map the `nodes` tree, replacing each node with (f node)."
  [nodes f]
  {:pre [(every? node? nodes) (ifn? f)]}
  (map #(update % :children map-recursively f) (map f nodes)))

(defn filter-recursively
  "Recursively filter through the `nodes` tree,
  retaining only the nodes for which (pred node) returns true."
  [nodes pred]
  {:pre [(every? node? nodes) (ifn? pred)]}
  (map #(update % :children filter-recursively pred) (filter pred nodes)))

(defn remove-recursively
  "Recursively filter through the `nodes` tree,
  removing the nodes for which (pred node) returns true."
  [nodes pred]
  {:pre [(every? node? nodes) (ifn? pred)]}
  (map #(update % :children remove-recursively pred) (remove pred nodes)))

(defn replace-recursively
  "Recursively replace every occurrence of `match` in the `nodes` tree with `replacement`"
  [nodes match replacement]
  {:pre [(every? node? nodes) (node? match) (node? replacement)]}
  (map-recursively nodes (fn [node] (if (= node match) replacement node))))

; The following functions take a single root node as the first argument,
; which acts as the recursion anchor point

(defn search
  "Return a sequence of all nodes in the `root` tree for which (pred node) returns true."
  [root pred]
  {:pre [(node? root) (ifn? pred)]}
  (filter pred (tree-seq node? :children root)))

(defn parent-of?
  "Return `child` if `child` is one of `parent`'s children, otherwise nil."
  [parent child]
  {:pre [(node? parent) (node? child)]}
  (some #{child} (:children parent)))

(defn find-parent
  "Search through the `root` tree and return the first parent node of `child`
  (potentially returns `root`)."
  [root child]
  {:pre [(node? root) (node? child)]}
  (first (search root (fn [parent] (parent-of? parent child)))))
