  /**
   * Release a lock on a resource
   * @param resource - The resource to unlock
   * @param owner - The owner releasing the lock
   * @returns Promise resolving to true if lock was released
   */
  public async releaseLock(resource: string, owner: string): Promise<boolean> {
    // Try both regular key and collaborative key
    const regularKey = resource;
    const collaborativeKey = `${resource}#${owner}`;

    let lockInfo = this.locks.get(regularKey);
    let keyUsed = regularKey;

    if (!lockInfo || lockInfo.owner !== owner) {
      lockInfo = this.locks.get(collaborativeKey);
      keyUsed = collaborativeKey;
    }

    if (!lockInfo) {
      logger.warn('Attempted to release non-existent lock', { resource, owner });
      return false;
    }

    if (lockInfo.owner !== owner) {
      throw new OpenCodeError(
        'LOCK_PERMISSION_DENIED',
        `Cannot release lock owned by '${lockInfo.owner}'`,
        { resource, owner, lockOwner: lockInfo.owner }
      );
    }

    this.locks.delete(keyUsed);

    const duration = Date.now() - lockInfo.acquiredAt.getTime();
    logger.info('Lock released', {
      resource,
      owner,
      duration,
      totalLocks: this.locks.size,
    });

    return true;
  }
