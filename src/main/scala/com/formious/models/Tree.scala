package com.formious.models

/**
  * @tparam A Type of each value in the tree
  */
sealed trait TreeNode[A] {
  /**
    * List of children; potentially empty
    */
  val children: Seq[BranchNode[A]]

  /**
    * Flattens recursively, depth-first
    *
    * Funny that this sort of compiles without the explicit return type, but fails on the ++ symbol
    */
  def flatten: Seq[BranchNode[A]] = {
    // TODO: make lazy
    children.foldLeft(Seq.empty[BranchNode[A]]) { case (matching, node) =>
      // each match will be stuck at the beginning of the accumulator,
      // so, the first match will end up at the end of the accumulator
      node.children.flatMap(_.flatten) ++ (node +: matching)
    }
  }

  /**
    * Depth first search
    */
  def findAll(fn: (A) => Boolean): Seq[BranchNode[A]] = {
    flatten.filter(node => fn(node.value))
  }

  /**
    * Returns the first result.
    */
  def findFirst(fn: (A) => Boolean): Option[BranchNode[A]] = {
    findAll(fn).lastOption
  }

  def findParent(node: TreeNode[A]): Option[TreeNode[A]] = {
    children.foldLeft(Option.empty[TreeNode[A]]) {
      case (None, child) =>
        if (child == node)
          Some(this)
        else
          child.findParent(node)
      case (Some(found), _) =>
        Some(found)
    }
  }

  /**
    * @return A list from nearest to root, e.g.:
    *   parent_of_most_recent :: grandparent_of_most_recent :: ... :: Nil
    */
  def parentPath(node: TreeNode[A]): List[TreeNode[A]] = {
    findParent(node) match {
      case Some(parent) =>
        parent :: parentPath(parent)
      case None =>
        Nil
    }
  }

  def mapWithParent[B](fn: (A, Option[TreeNode[A]]) => B, parentNode: Option[TreeNode[A]]): TreeNode[B]
}

/**
  * @param value A None value indicates the root node
  */
final case class BranchNode[A](children: Seq[BranchNode[A]], value: A) extends TreeNode[A] {
  def mapWithParent[B](fn: (A, Option[TreeNode[A]]) => B, parentNode: Option[TreeNode[A]]): BranchNode[B] = {
    val mappedChildren = children.map(_.mapWithParent(fn, Some(this)))
    BranchNode(mappedChildren, fn(value, parentNode))
  }
}

final case class RootNode[A](children: Seq[BranchNode[A]]) extends TreeNode[A] {
  def mapWithParent[B](fn: (A, Option[TreeNode[A]]) => B, parentNode: Option[TreeNode[A]]): RootNode[B] = {
    val mappedChildren = children.map(_.mapWithParent(fn, Some(this)))
    RootNode(mappedChildren)
  }
}
