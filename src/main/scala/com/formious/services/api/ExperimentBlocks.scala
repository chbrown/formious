package com.formious.services.api

import scalikejdbc.{delete => _, _}

import com.formious.models.{Block, RootNode}
import io.finch._
import io.finch.circe._

object ExperimentBlocks {
  /** GET /api/experiments/:experiment_id/blocks
    * list all of an experiment's blocks */
  val listBlocks: Endpoint[List[Block]] = get(int :: "blocks") { (experiment_id: Int) =>
    Ok(Block.all(experiment_id))
  }

  /** GET /api/experiments/:experiment_id/blocks/:block_id
    * Create blank block */
  val newBlock: Endpoint[Block] = get(int :: "blocks" :: "new") { (experiment_id: Int) =>
    Ok(Block.empty)
  }

  /** POST /api/experiments/:experiment_id/blocks
    * Create new block */
  val createBlock: Endpoint[Block] = post(int :: "blocks" :: paramOption("template_id").as[Int] :: param("context") :: param("view_order").as[Double] :: param("randomize").as[Boolean] :: paramOption("parent_block_id").as[Int]) { (experiment_id: Int, template_id: Option[Int], context: String, view_order: Double, randomize: Boolean, parent_block_id: Option[Int]) =>
    val block = DB.localTx { implicit session =>
      withSQL {
        insert.into(Block).namedValues(
          Block.column.experiment_id -> experiment_id,
          Block.column.template_id -> template_id,
          Block.column.context -> context,
          Block.column.view_order -> view_order,
          Block.column.randomize -> randomize,
          Block.column.parent_block_id -> parent_block_id
        ).append(sqls"RETURNING *")
      }.map(Block(_)).single.apply().get
    }
    Created(block)
  }

  /** GET /api/experiments/:experiment_id/blocks/:block_id
    * Show block details */
  val showBlock: Endpoint[Block] = get(int :: "blocks" :: int) { (experiment_id: Int, block_id: Int) =>
    Ok(Block.find(experiment_id, block_id))
  }

  /** POST /api/experiments/:experiment_id/blocks/:block_id
    * Update existing block */
  val updateBlock: Endpoint[Unit] = post(int :: "blocks" :: int :: paramOption("template_id").as[Int] :: param("context") :: param("view_order").as[Double] :: param("randomize").as[Boolean] :: paramOption("parent_block_id").as[Int]) { (experiment_id: Int, block_id: Int, template_id: Option[Int], context: String, view_order: Double, randomize: Boolean, parent_block_id: Option[Int]) =>
    DB.localTx { implicit session =>
      withSQL {
        update(Block).set(
          Block.column.template_id -> template_id,
          Block.column.context -> context,
          Block.column.view_order -> view_order,
          Block.column.randomize -> randomize,
          Block.column.parent_block_id -> parent_block_id
        ).where.eq(Block.column.id, block_id).and.eq(Block.column.experiment_id, experiment_id)
      }.update.apply()
    }
    NoContent[Unit]
  }

  /** DELETE /api/experiments/:experiment_id/blocks/:block_id
    * Delete block */
  val deleteBlock: Endpoint[Unit] = delete(int :: "blocks" :: int) { (experiment_id: Int, id: Int) =>
    DB.localTx { implicit session =>
      withSQL {
        deleteFrom(Block)
          .where.eq(Block.column.id, id)
          .and.eq(Block.column.experiment_id, experiment_id)
      }.update.apply()
    }
    NoContent[Unit]
  }

  /**
    * GET /api/experiments/:experiment_id/blocks/tree
    * Special non-REST method to get all blocks and sort them into a tree. */
  val getBlockTree: Endpoint[RootNode[Block]] = get(int :: "blocks" :: "tree") { (experiment_id: Int) =>
    val blocks = Block.all(experiment_id)
    val rootNode = Block.buildTree(blocks)
    Ok(rootNode)
  }

  /**
    * PUT /api/experiments/:experiment_id/blocks/tree
    * *
    * Special non-REST method to store a tree structure of blocks and in a tree structure.
    */
  //val putBlockTree: Endpoint[String] = put(int :: "blocks" :: "tree" :: body) { (experiment_id: Int, body: String) =>
  //  parse(body).flatMap { json => json.as[RootNode[Block]] } match { // .getOrElse(Json.Null)
  //    case Xor.Left(failure) =>
  //      BadRequest(new Exception("Error decoding"))
  //    case Xor.Right(rootNode) =>
  //      Block.updateTree(rootNode, experiment_id)
  //      Ok("Successfully updated block tree")
  //  }
  //}

  val endpoint = "experiments" ::
    (listBlocks :+: newBlock :+: showBlock :+: updateBlock :+: deleteBlock)
}
