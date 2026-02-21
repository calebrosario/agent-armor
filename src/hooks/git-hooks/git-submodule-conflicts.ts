// Git Submodule Conflicts Hook - Phase 2: Edge Cases
// Week 15, Day 1-2: Git Submodule Conflicts

import { logger } from "../../util/logger";
import { BeforeTaskStartHook } from "../task-lifecycle";
import {
  getSubmoduleStatus,
  hasSubmoduleConflicts,
  resolveSubmoduleConflict,
} from "../../util/git-operations";

/**
 * Git Submodule Conflicts Hook - Detects and resolves submodule conflicts (Edge Case 9)
 *
 * Checks submodule status (clean/dirty/diverged), resolves with configurable strategy.
 */
export function createGitSubmoduleConflictsHook(
  resolutionStrategy: "merge" | "rebase" | "skip" = "merge",
): BeforeTaskStartHook {
  return async (taskId: string, agentId: string) => {
    logger.info("Checking for git submodule conflicts", {
      taskId,
      agentId,
      resolutionStrategy,
    });

    try {
      const workspacePath =
        process.env.OPENCODE_WORKSPACE || `/tmp/opencode-worktrees/${taskId}`;
      const taskMemoryPath = ".task-memory";

      const status = await getSubmoduleStatus(workspacePath, taskMemoryPath);

      logger.info("Submodule status", {
        taskId,
        taskMemoryPath,
        status,
      });

      if (status === "clean") {
        logger.info("No submodule conflicts detected", {
          taskId,
        });
        return;
      }

      if (status === "error") {
        logger.error("Submodule error detected", {
          taskId,
          taskMemoryPath,
        });
        throw new Error("Submodule status check failed");
      }

      const hasConflicts = await hasSubmoduleConflicts(
        workspacePath,
        taskMemoryPath,
      );

      if (!hasConflicts) {
        logger.info("No submodule conflicts to resolve", {
          taskId,
        });
        return;
      }

      logger.info("Resolving submodule conflicts", {
        taskId,
        status,
        resolution: resolutionStrategy,
      });

      const result = await resolveSubmoduleConflict(
        workspacePath,
        taskMemoryPath,
        resolutionStrategy,
      );

      if (result.success) {
        logger.info("Submodule conflicts resolved", {
          taskId,
          resolution: result.resolution,
          status: result.status,
        });
      } else {
        logger.error("Failed to resolve submodule conflicts", {
          taskId,
          error: result.error,
        });

        throw new Error(
          `Submodule conflict resolution failed: ${result.error}`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error("Git submodule conflict check failed", {
        taskId,
        agentId,
        error: errorMessage,
      });

      throw new Error(`Git submodule conflict check failed: ${errorMessage}`);
    }
  };
}
