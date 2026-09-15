/**
 * Transaction State Machine
 * Enforces legal state transitions and prevents unauthorized or invalid status modifications.
 */

const LEGAL_TRANSITIONS = {
  PENDING: ['AWAITING_AUTHORIZATION', 'AUTHORIZED', 'CANCELLED', 'FAILED'],
  AWAITING_AUTHORIZATION: ['AUTHORIZED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
  AUTHORIZED: ['PROCESSING', 'FAILED', 'CANCELLED'],
  PROCESSING: ['COMPLETED', 'FAILED'],
  // Terminal states cannot transition to anything
  COMPLETED: [],
  REJECTED: [],
  FAILED: [],
  EXPIRED: [],
  CANCELLED: [],
};

class IllegalStateTransitionError extends Error {
  constructor(fromState, toState) {
    super(`Illegal transaction state transition: Cannot change state from '${fromState}' to '${toState}'.`);
    this.name = 'IllegalStateTransitionError';
    this.statusCode = 400;
  }
}

/**
 * Validate whether transition from currentState to nextState is permitted
 */
const canTransition = (currentState, nextState) => {
  const allowed = LEGAL_TRANSITIONS[currentState] || [];
  return allowed.includes(nextState);
};

/**
 * Transition transaction to next state with audit protection
 */
const transition = (transaction, nextState) => {
  if (!canTransition(transaction.state, nextState)) {
    throw new IllegalStateTransitionError(transaction.state, nextState);
  }
  transaction.state = nextState;
  return transaction;
};

module.exports = {
  LEGAL_TRANSITIONS,
  IllegalStateTransitionError,
  canTransition,
  transition,
};
