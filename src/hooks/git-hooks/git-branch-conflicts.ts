// Git Branch Conflicts Hook - Phase 2: Edge Cases
// Week 15, Day 1-2: Git Branch Naming Conflicts

import { logger } from "../../util/logger";
import { BeforeTaskStartHook } from "../task-lifecycle";
import {
  createTaskBranch,
  branchExists,
  getWorkspacePath,
} from "../../util/git-operations";

/**
 * Git Branch Conflicts Hook - Handles branch naming conflicts (Edge Case 6)
 *
 * Detects existing branches, creates unique names via git-operations.createTaskBranch,
 * logs resolution details, throws on failure.
 */
export function createGitBranchConflictsHook(): BeforeTaskStartHook {
  return async (taskId: string, agentId: string) => {
    logger.info("Checking for git branch conflicts", {
      taskId,
      agentId,
    });

    try {
      const workspacePath = getWorkspacePath(taskId);
      const baseName = `task/${taskId}`;

      const exists = await branchExists(workspacePath, baseName);

      if (exists) {
        logger.info("Branch already exists, will create unique name", {
          taskId,
          baseName,
        });
      }

      const result = await createTaskBranch(taskId, workspacePath);

      if (result.success) {
        logger.info("Branch created with conflict handling", {
          taskId,
          branchName: result.branchName,
          attempts: result.attempts,
          agentId,
        });

        if (result.note) {
          logger.info("Branch creation note", {
            taskId,
            note: result.note,
          });
        }
      } else {
        logger.error("Failed to create branch after conflicts", {
          taskId,
          error: result.error,
          attempts: result.attempts,
        });

        throw new Error(`Branch creation failed: ${result.error}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error("Git branch conflict check failed", {
        taskId,
        agentId,
        error: errorMessage,
      });

      throw new Error(`Git branch conflict check failed: ${errorMessage}`);
    }
  };
}
