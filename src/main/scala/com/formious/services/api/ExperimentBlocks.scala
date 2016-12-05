package com.formious.services.api

import io.circe.generic.auto._
import io.circe.syntax.EncoderOps

import com.formious.models.{Block, RootNode}
import com.formious.common.Encoders._
import com.formious.common.Decoders._

import org.http4s._
import org.http4s.dsl._
import org.http4s.circe._

object ExperimentBlocks {
  case class BlockData(template_id: Option[Int],
                       context: String,
                       view_order: Double,
                       randomize: Boolean,
                       parent_block_id: Option[Int],
                       quota: Option[Int])

  val service = HttpService {
    case GET -> Root / IntVar(experiment_id) / "blocks" =>
      // GET /api/experiments/:experiment_id/blocks
      // list all of an experiment's blocks
      Ok(Block.all(experiment_id).asJson)
    case GET -> Root / IntVar(experiment_id) / "blocks" / "new" =>
      Ok(BlockData(None, "{}", 0.0, false, None, None).asJson)
    case request @ POST -> Root / IntVar(experiment_id) / "blocks" =>
      request.as(jsonOf[BlockData]).flatMap { bodyExperiment =>
        val BlockData(template_id, context, view_order, randomize, parent_block_id, quota) = bodyExperiment
        val block = Block.create(experiment_id, template_id, context, view_order, randomize, parent_block_id, quota)
        Created(block.asJson)
      }
    case GET -> Root / IntVar(experiment_id) / "blocks" / IntVar(id) =>
      Ok(Block.find(experiment_id, id).asJson)
    case request @ POST -> Root / IntVar(experiment_id) / "blocks" / IntVar(id) =>
      request.as(jsonOf[Block]).flatMap { bodyBlock =>
        val Block(_, _, template_id, context, view_order, randomize, parent_block_id, quota, _) = bodyBlock
        Block.update(id, experiment_id, template_id, context, view_order, randomize, parent_block_id, quota)
        NoContent()
      }
    case DELETE -> Root / IntVar(experiment_id) / "blocks" / IntVar(id) =>
      Block.delete(id, experiment_id)
      NoContent()
    case GET -> Root / IntVar(experiment_id) / "blocks" / "tree" =>
      // GET /api/experiments/:experiment_id/blocks/tree
      // Special non-REST method to get all blocks and sort them into a tree.
      val blocks = Block.all(experiment_id)
      val rootNode = Block.buildTree(blocks)
      Ok(rootNode.asJson)
    //case PUT -> Root / IntVar(experiment_id) / "blocks" / "tree" =>
    // PUT /api/experiments/:experiment_id/blocks/tree
    // Special non-REST method to store a tree structure of blocks and in a tree structure.
    //val putBlockTree: Endpoint[String] = put(int :: "blocks" :: "tree" :: body) { (experiment_id: Int, body: String) =>
    //  parse(body).flatMap { json => json.as[RootNode[Block]] } match { // .getOrElse(Json.Null)
    //    case Xor.Left(failure) =>
    //      BadRequest(new Exception("Error decoding"))
    //    case Xor.Right(rootNode) =>
    //      Block.updateTree(rootNode, experiment_id)
    //      Ok("Successfully updated block tree")
    //  }
    //}
  }
}
