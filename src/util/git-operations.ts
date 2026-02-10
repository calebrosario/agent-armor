// Git Operations Helper - Phase 2: Edge Cases
// Week 15, Day 1-2: Git Branch Naming Conflicts

import { exec } from "child_process";
import { logger } from "./logger";
import * as fs from "fs/promises";

/**
 * Git Operations Helper - Provides atomic Git operations with conflict handling
 */

export interface BranchResult {
  success: boolean;
  branchName?: string;
  attempts: number;
  error?: string;
  note?: string;
}

export interface GitLock {
  acquired: boolean;
  lockFile: string;
}

/**
 * Get workspace path for a task
 * Assumes standard opencode worktree structure
 */
export function getWorkspacePath(taskId: string): string {
  // In a real implementation, this would query TaskRegistry or use config
  // For now, use a standard path pattern
  const basePath = process.env.OPENCODE_WORKSPACE || "/tmp/opencode-worktrees";
  return `${basePath}/${taskId}`;
}

/**
 * Generate unique branch name with timestamp + random suffix
 */
export function generateUniqueBranchName(
  baseName: string,
  attempt: number = 0,
): string {
  if (attempt === 0) {
    return baseName;
  }

  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const suffix = `${timestamp}-${random}`;

  return `${baseName}-${suffix}`;
}

/**
 * Check if branch exists locally
 */
export async function branchExists(
  workspacePath: string,
  branchName: string,
): Promise<boolean> {
  try {
    await exec("git rev-parse --verify " + branchName, {
      cwd: workspacePath,
      timeout: 5000,
    });
    return true;
  } catch (error: any) {
    if (error.message?.includes("unknown name") || error.code === 128) {
      return false;
    }
    throw error;
  }
}

/**
 * Acquire file lock for atomic Git operations
 */
export async function acquireLock(
  lockFile: string,
  timeout: number = 30000,
): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const fd = await fs.open(lockFile, "wx");
      await fd.close();
      return;
    } catch (error: any) {
      if (error.code !== "EEXIST") {
        throw error;
      }
      // Lock exists, wait and retry
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  throw new Error(`Failed to acquire lock after ${timeout}ms: ${lockFile}`);
}

/**
 * Release file lock
 */
export async function releaseLock(lockFile: string): Promise<void> {
  try {
    await fs.unlink(lockFile);
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      logger.error("Failed to release lock", {
        lockFile,
        error: error.message,
      });
    }
  }
}

/**
 * Create task branch with conflict handling and retry logic
 *
 * @param taskId - Task ID
 * @param workspacePath - Git workspace path
 * @returns Branch result
 */
export async function createTaskBranch(
  taskId: string,
  workspacePath?: string,
): Promise<BranchResult> {
  const baseName = `task/${taskId}`;
  const maxAttempts = 10;
  let attempts = 0;

  // Use provided workspace or derive from taskId
  const wsPath = workspacePath || getWorkspacePath(taskId);

  // Lock file path for atomic operations
  const lockFile = `${wsPath}/.git/branch-creation.lock`;

  try {
    // Ensure workspace directory exists
    await fs.mkdir(wsPath, { recursive: true });

    // Initialize git repo if needed
    try {
      await exec("git init", { cwd: wsPath });
    } catch (error: any) {
      if (!error.message?.includes("reinitialized")) {
        logger.warn("Git init failed", { error: error.message });
      }
    }

    // Acquire lock for atomic branch creation
    await acquireLock(lockFile);

    try {
      while (attempts < maxAttempts) {
        attempts++;

        // Generate branch name (with unique suffix if retrying)
        const branchName = generateUniqueBranchName(baseName, attempts - 1);

        // Check if branch exists
        const exists = await branchExists(wsPath, branchName);

        if (!exists) {
          // Branch doesn't exist, create it
          try {
            await exec(`git checkout -b ${branchName}`, {
              cwd: wsPath,
              timeout: 10000,
            });

            logger.info("Task branch created", {
              taskId,
              branchName,
              attempts,
            });

            return {
              success: true,
              branchName,
              attempts,
            };
          } catch (error: any) {
            logger.error("Failed to create branch", {
              taskId,
              branchName,
              error: error.message,
            });
            throw error;
          }
        } else {
          // Branch exists, will retry with unique suffix
          logger.debug("Branch already exists", {
            taskId,
            branchName,
            attempts,
          });
        }
      }

      // Max attempts reached
      throw new Error(
        `Failed to create unique branch after ${maxAttempts} attempts. Base: ${baseName}`,
      );
    } finally {
      // Release lock
      await releaseLock(lockFile);
    }
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error("Failed to create task branch", {
      taskId,
      baseName,
      error: errorMessage,
    });

    return {
      success: false,
      attempts,
      error: errorMessage,
    };
  }
}
